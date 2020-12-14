import { P2P } from "@arkecosystem/core-interfaces";
import Ajv from "ajv";
import delay from "delay";
import { validate } from "json-validator-duplicated-keys";

import { cidr } from "ip";
import { RateLimiter } from "../rate-limiter";
import { buildRateLimiter } from "../utils";

import SCWorker from "socketcluster/scworker";
import { requestSchemas } from "../schemas";
import { codec } from "../utils/sc-codec";
import { validateTransactionLight } from "./utils/validate";

const SOCKET_TIMEOUT = 2000;
const MINUTE_IN_MILLISECONDS = 1000 * 60;
const HOUR_IN_MILLISECONDS = MINUTE_IN_MILLISECONDS * 60;

const ajv = new Ajv({ extendRefs: true });

export class Worker extends SCWorker {
    private config: Record<string, any>;
    private handlers: string[] = [];
    private ipLastError: Record<string, number> = {};
    private rateLimiter: RateLimiter;
    private rateLimitedEndpoints: any;

    public async run() {
        this.log(`Socket worker started, PID: ${process.pid}`);

        this.scServer.setCodecEngine(codec);

        await this.loadRateLimitedEndpoints();
        await this.loadConfiguration();

        this.rateLimiter = buildRateLimiter({
            rateLimit: this.config.rateLimit,
            remoteAccess: this.config.remoteAccess,
            whitelist: this.config.whitelist,
        });

        // purge ipLastError every hour to free up memory
        setInterval(() => (this.ipLastError = {}), HOUR_IN_MILLISECONDS);

        await this.loadHandlers();

        // @ts-ignore
        this.scServer.wsServer._server.timeout = SOCKET_TIMEOUT;

        // @ts-ignore
        this.scServer.wsServer.on("connection", (ws, req) => {
            const clients = [...Object.values(this.scServer.clients), ...Object.values(this.scServer.pendingClients)];
            const existingSockets = clients.filter(
                client =>
                    client.remoteAddress === req.socket.remoteAddress && client.remotePort !== req.socket.remotePort,
            );
            for (const socket of existingSockets) {
                socket.terminate();
            }
            this.handlePayload(ws, req);
        });
        // @ts-ignore
        this.httpServer.on("request", req => {
            // @ts-ignore
            if (req.method !== "GET" || req.url !== this.scServer.wsServer.options.path) {
                this.setErrorForIpAndDestroy(req.socket);
            }
        });
        // @ts-ignore
        this.scServer.wsServer._server.on("connection", socket => this.handleSocket(socket));
        this.scServer.on("connection", socket => this.handleConnection(socket));
        this.scServer.addMiddleware(this.scServer.MIDDLEWARE_EMIT, (req, next) => this.handleEmit(req, next));
    }

    private async loadHandlers(): Promise<void> {
        const { data } = await this.sendToMasterAsync("p2p.utils.getHandlers");
        for (const [version, handlers] of Object.entries(data)) {
            for (const handler of Object.values(handlers)) {
                this.handlers.push(`p2p.${version}.${handler}`);
            }
        }
    }

    private async loadConfiguration(): Promise<void> {
        const { data } = await this.sendToMasterAsync("p2p.utils.getConfig");
        this.config = data;
    }

    private async loadRateLimitedEndpoints(): Promise<void> {
        const { data } = await this.sendToMasterAsync("p2p.internal.getRateLimitedEndpoints", { data: {} });
        this.rateLimitedEndpoints = (Array.isArray(data) ? data : []).reduce((object, value) => {
            object[value] = true;
            return object;
        }, {});
    }

    private getRateLimitedEndpoints() {
        return this.rateLimitedEndpoints;
    }

    private handlePayload(ws, req) {
        ws.removeAllListeners("ping");
        ws.removeAllListeners("pong");
        ws.prependListener("ping", () => {
            this.setErrorForIpAndDestroy(req.socket);
        });
        ws.prependListener("pong", () => {
            this.setErrorForIpAndDestroy(req.socket);
        });

        ws.prependListener("error", error => {
            if (error instanceof RangeError) {
                this.setErrorForIpAndDestroy(req.socket);
            }
        });

        const messageListeners = ws.listeners("message");
        ws.removeAllListeners("message");
        ws.prependListener("message", message => {
            if (req.socket._disconnected) {
                return this.setErrorForIpAndDestroy(req.socket);
            } else if (typeof message !== "string") {
                return this.setErrorForIpAndDestroy(req.socket);
            } else if (message === "#2") {
                const timeNow: number = new Date().getTime() / 1000;
                if (req.socket._lastPingTime && timeNow - req.socket._lastPingTime < 1) {
                    return this.setErrorForIpAndDestroy(req.socket);
                }
                req.socket._lastPingTime = timeNow;
            } else if (message.length < 10) {
                // except for #2 message, we should have JSON with some required properties
                // (see below) which implies that message length should be longer than 10 chars
                return this.setErrorForIpAndDestroy(req.socket);
            } else {
                try {
                    const parsed = JSON.parse(message);
                    if (validate(message) !== undefined) {
                        return this.setErrorForIpAndDestroy(req.socket);
                    } else if (parsed.event === "#disconnect") {
                        req.socket._disconnected = true;
                        if (
                            typeof parsed.data !== "object" ||
                            typeof parsed.data.code !== "number" ||
                            Object.keys(parsed).length !== 2 ||
                            Object.keys(parsed.data).length !== 1
                        ) {
                            return this.setErrorForIpAndDestroy(req.socket);
                        }
                    } else if (parsed.event === "#handshake") {
                        if (req.socket._handshake) {
                            return this.setErrorForIpAndDestroy(req.socket);
                        }
                        req.socket._handshake = true;
                        clearTimeout(req.socket._connectionTimer);
                    } else if (
                        typeof parsed.event !== "string" ||
                        typeof parsed.data !== "object" ||
                        this.hasAdditionalProperties(parsed) ||
                        (typeof parsed.cid !== "number" && typeof parsed.cid !== "undefined") ||
                        !this.handlers.includes(parsed.event)
                    ) {
                        return this.setErrorForIpAndDestroy(req.socket);
                    }
                } catch (error) {
                    return this.setErrorForIpAndDestroy(req.socket);
                }
            }

            // we call the other listeners ourselves
            for (const listener of messageListeners) {
                listener(message);
            }
        });
    }

    private hasAdditionalProperties(object): boolean {
        if (Object.keys(object).filter(key => key !== "event" && key !== "data" && key !== "cid").length) {
            return true;
        }
        const event = object.event.split(".");
        if (object.event !== "#handshake" && object.event !== "#disconnect") {
            if (event.length !== 3) {
                return true;
            }
            if (Object.keys(object.data).filter(key => key !== "data" && key !== "headers").length) {
                return true;
            }
        }
        if (object.data.data) {
            // @ts-ignore
            const [_, version, handler] = event;
            const schema = requestSchemas[version][handler];
            try {
                if (object.event === "p2p.peer.postTransactions") {
                    if (
                        typeof object.data.data === "object" &&
                        Object.keys(object.data.data).length === 1 && // {transactions}
                        object.data.data.transactions &&
                        Array.isArray(object.data.data.transactions) &&
                        object.data.data.transactions.length <= this.config.maxTransactionsPerRequest
                    ) {
                        for (const transaction of object.data.data.transactions) {
                            if (!validateTransactionLight(transaction)) {
                                return true;
                            }
                        }
                    } else {
                        return true;
                    }
                } else if (object.event === "p2p.peer.postBlock") {
                    if (
                        !(
                            typeof object.data.data === "object" &&
                            typeof object.data.data.block === "object" &&
                            object.data.data.block.base64 === true &&
                            typeof object.data.data.block.data === "string" &&
                            Object.keys(object.data.data).length === 1 && // {block}
                            Object.keys(object.data.data.block).length === 2
                        ) // {base64, data}
                    ) {
                        return true;
                    }
                } else if (object.event === "p2p.peer.getCommonBlocks") {
                    if (
                        typeof object.data.data === "object" &&
                        object.data.data.ids &&
                        Array.isArray(object.data.data.ids) &&
                        object.data.data.ids.length >= schema.properties.ids.minItems &&
                        object.data.data.ids.length <= schema.properties.ids.maxItems
                    ) {
                        for (const id of object.data.data.ids) {
                            if (
                                typeof id !== "string" ||
                                !(/^[0-9]{1,20}$/.test(id) || /^[0-9a-f]{16}$/i.test(id) || /^[0-9a-f]{64}$/i.test(id))
                            ) {
                                return true;
                            }
                        }
                    } else {
                        return true;
                    }
                } else if (schema && !ajv.validate(schema, object.data.data)) {
                    return true;
                }
            } catch {
                //
            }
        }
        if (object.data.headers) {
            if (
                Object.keys(object.data.headers).filter(
                    key => key !== "version" && key !== "port" && key !== "height" && key !== "Content-Type",
                ).length
            ) {
                return true;
            }
            if (
                (object.data.headers.version && typeof object.data.headers.version !== "string") ||
                (object.data.headers.port && typeof object.data.headers.port !== "number") ||
                (object.data.headers["Content-Type"] && typeof object.data.headers["Content-Type"] !== "string") ||
                (object.data.headers.height && typeof object.data.headers.height !== "number")
            ) {
                // this prevents the nesting of other objects inside these properties
                return true;
            }
        }
        return false;
    }

    private setErrorForIpAndDestroy(socket): void {
        this.ipLastError[socket.remoteAddress] = Date.now();
        socket.destroy();
    }

    private async handleConnection(socket): Promise<void> {
        for (const handler of this.handlers) {
            // @ts-ignore
            socket.on(handler, async (data, res) => {
                try {
                    return res(undefined, await this.sendToMasterAsync(handler, data));
                } catch (e) {
                    return res(e);
                }
            });
        }
    }

    private async handleSocket(socket): Promise<void> {
        const ip = socket.remoteAddress;
        if (!ip || (this.ipLastError[ip] && this.ipLastError[ip] > Date.now() - MINUTE_IN_MILLISECONDS)) {
            socket.destroy();
            return;
        }

        socket._connectionTimer = setTimeout(() => {
            if (!socket._handshake) {
                this.setErrorForIpAndDestroy(socket);
            }
        }, SOCKET_TIMEOUT * 2);

        const { data }: { data: { blocked: boolean } } = await this.sendToMasterAsync(
            "p2p.internal.isBlockedByRateLimit",
            {
                data: { ip },
            },
        );

        const isBlacklisted: boolean = (this.config.blacklist || []).includes(ip);
        if (data.blocked || isBlacklisted) {
            socket.destroy();
            return;
        }

        const cidrRemoteAddress = cidr(`${ip}/24`);
        const sameSubnetSockets = Object.values({ ...this.scServer.clients, ...this.scServer.pendingClients }).filter(
            client => cidr(`${client.remoteAddress}/24`) === cidrRemoteAddress,
        );
        if (sameSubnetSockets.length > this.config.maxSameSubnetPeers) {
            socket.destroy();
            return;
        }
    }

    private terminateSetErrorAndDestroy(socket) {
        socket.terminate();
        this.setErrorForIpAndDestroy(socket);
    }

    private async handleEmit(req, next): Promise<void> {
        if (req.event.length > 128) {
            this.terminateSetErrorAndDestroy(req.socket);
            return;
        }
        const rateLimitedEndpoints = this.getRateLimitedEndpoints();
        const useLocalRateLimiter: boolean = !rateLimitedEndpoints[req.event];
        if (useLocalRateLimiter) {
            if (await this.rateLimiter.hasExceededRateLimit(req.socket.remoteAddress, req.event)) {
                this.terminateSetErrorAndDestroy(req.socket);
                return;
            }
        } else {
            const { data }: { data: P2P.IRateLimitStatus } = await this.sendToMasterAsync(
                "p2p.internal.getRateLimitStatus",
                {
                    data: {
                        ip: req.socket.remoteAddress,
                        endpoint: req.event,
                    },
                },
            );
            if (data.exceededLimitOnEndpoint) {
                this.terminateSetErrorAndDestroy(req.socket);
                return;
            }
        }

        // ensure basic format of incoming data, req.data must be as { data, headers }
        if (typeof req.data !== "object" || typeof req.data.data !== "object" || typeof req.data.headers !== "object") {
            this.terminateSetErrorAndDestroy(req.socket);
            return;
        }

        try {
            const [prefix, version, handler] = req.event.split(".");

            if (prefix !== "p2p") {
                this.terminateSetErrorAndDestroy(req.socket);
                return;
            }

            // Check that blockchain, tx-pool and p2p are ready
            const isAppReady: boolean = (await this.sendToMasterAsync("p2p.utils.isAppReady")).data.ready;
            if (!isAppReady) {
                next(new Error("App is not ready."));
                return;
            }

            if (version === "internal") {
                const { data } = await this.sendToMasterAsync("p2p.utils.isForgerAuthorized", {
                    data: { ip: req.socket.remoteAddress },
                });

                if (!data.authorized) {
                    this.terminateSetErrorAndDestroy(req.socket);
                    return;
                }
            } else if (version === "peer") {
                const requestSchema = requestSchemas.peer[handler];
                if (handler !== "postTransactions" && requestSchema && !ajv.validate(requestSchema, req.data.data)) {
                    this.terminateSetErrorAndDestroy(req.socket);
                    return;
                }

                this.sendToMasterAsync("p2p.internal.acceptNewPeer", {
                    data: { ip: req.socket.remoteAddress },
                    headers: req.data.headers,
                }).catch(ex => {
                    this.log(`Failed to accept new peer ${req.socket.remoteAddress}: ${ex.message}`, "debug");
                });
            } else {
                this.terminateSetErrorAndDestroy(req.socket);
                return;
            }

            // some handlers need this remoteAddress info
            // req.data is socketcluster request data, which corresponds to our own "request" object
            // which is like this { endpoint, data, headers }
            req.data.headers.remoteAddress = req.socket.remoteAddress;
        } catch (e) {
            this.log(e.message, "error");

            this.terminateSetErrorAndDestroy(req.socket);
            return;
        }
        await delay(1);
        next();
    }

    private async log(message: string, level: string = "info"): Promise<void> {
        try {
            await this.sendToMasterAsync("p2p.utils.log", {
                data: { level, message },
            });
        } catch (e) {
            console.error(`Error while trying to log the following message: ${message}`);
        }
    }

    private async sendToMasterAsync(endpoint: string, data?: Record<string, any>): Promise<any> {
        return new Promise((resolve, reject) => {
            this.sendToMaster(
                {
                    ...{ endpoint },
                    ...data,
                },
                (err, res) => (err ? reject(err) : resolve(res)),
            );
        });
    }
}

// tslint:disable-next-line
new Worker();
