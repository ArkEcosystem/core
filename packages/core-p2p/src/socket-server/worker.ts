import Ajv from "ajv";
import { cidr } from "ip";
import SCWorker from "socketcluster/scworker";
import { SocketErrors } from "../enums";
import { requestSchemas } from "../schemas";
import { RateLimiter } from "./rate-limiter";
import { validateTransactionLight } from "./utils/validate";

const MINUTE_IN_MILLISECONDS = 1000 * 60;
const HOUR_IN_MILLISECONDS = MINUTE_IN_MILLISECONDS * 60;

const ajv = new Ajv({ extendRefs: true });

export class Worker extends SCWorker {
    private config: Record<string, any>;
    private handlers: string[] = [];
    private ipLastError: Record<string, number> = {};
    private rateLimiter: RateLimiter;

    public async run() {
        this.log(`Socket worker started, PID: ${process.pid}`);

        await this.loadConfiguration();

        // purge ipLastError every hour to free up memory
        setInterval(() => (this.ipLastError = {}), HOUR_IN_MILLISECONDS);

        await this.loadHandlers();

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
        this.scServer.on("connection", socket => this.handleConnection(socket));
        this.scServer.addMiddleware(this.scServer.MIDDLEWARE_HANDSHAKE_WS, (req, next) =>
            this.handleHandshake(req, next),
        );
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
        this.rateLimiter = new RateLimiter({
            whitelist: [...this.config.whitelist, ...this.config.remoteAccess],
            configurations: {
                global: {
                    rateLimit: this.config.rateLimit,
                    blockDuration: 60 * 1, // 1 minute ban for now
                },
                endpoints: [
                    {
                        rateLimit: 1,
                        duration: 4,
                        endpoint: "p2p.peer.postBlock",
                    },
                    {
                        rateLimit: 1,
                        endpoint: "p2p.peer.getBlocks",
                    },
                    {
                        rateLimit: 1,
                        endpoint: "p2p.peer.getPeers",
                    },
                    {
                        rateLimit: 2,
                        endpoint: "p2p.peer.getStatus",
                    },
                    {
                        rateLimit: 5,
                        endpoint: "p2p.peer.getCommonBlocks",
                    },
                ],
            },
        });
    }

    private handlePayload(ws, req) {
        ws.removeAllListeners("ping");
        ws.removeAllListeners("pong");
        ws.prependListener("ping", () => {
            this.setErrorForIpAndTerminate(ws, req);
        });
        ws.prependListener("pong", () => {
            this.setErrorForIpAndTerminate(ws, req);
        });

        ws.prependListener("error", error => {
            if (error instanceof RangeError) {
                this.setErrorForIpAndTerminate(ws, req);
            }
        });

        const messageListeners = ws.listeners("message");
        ws.removeAllListeners("message");
        ws.prependListener("message", message => {
            if (ws._disconnected) {
                return this.setErrorForIpAndTerminate(ws, req);
            } else if (message === "#2") {
                const timeNow: number = new Date().getTime() / 1000;
                if (ws._lastPingTime && timeNow - ws._lastPingTime < 1) {
                    return this.setErrorForIpAndTerminate(ws, req);
                }
                ws._lastPingTime = timeNow;
            } else if (message.length < 10) {
                // except for #2 message, we should have JSON with some required properties
                // (see below) which implies that message length should be longer than 10 chars
                return this.setErrorForIpAndTerminate(ws, req);
            } else {
                try {
                    const parsed = JSON.parse(message);
                    if (parsed.event === "#disconnect") {
                        ws._disconnected = true;
                    } else if (parsed.event === "#handshake") {
                        if (ws._handshake) {
                            return this.setErrorForIpAndTerminate(ws, req);
                        }
                        ws._handshake = true;
                    } else if (
                        typeof parsed.event !== "string" ||
                        typeof parsed.data !== "object" ||
                        this.hasAdditionalProperties(parsed) ||
                        (typeof parsed.cid !== "number" &&
                            (parsed.event === "#disconnect" && typeof parsed.cid !== "undefined")) ||
                        !this.handlers.includes(parsed.event)
                    ) {
                        return this.setErrorForIpAndTerminate(ws, req);
                    }
                } catch (error) {
                    return this.setErrorForIpAndTerminate(ws, req);
                }
            }

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

    private setErrorForIpAndTerminate(ws, req): void {
        this.ipLastError[req.socket.remoteAddress] = Date.now();
        ws.terminate();
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

    private async handleHandshake(req, next): Promise<void> {
        const ip = req.socket.remoteAddress;
        if (this.ipLastError[ip] && this.ipLastError[ip] > Date.now() - MINUTE_IN_MILLISECONDS) {
            req.socket.destroy();
            return;
        }

        const isBlocked = await this.rateLimiter.isBlocked(ip);
        const isBlacklisted = (this.config.blacklist || []).includes(ip);
        if (isBlocked || isBlacklisted) {
            next(this.createError(SocketErrors.Forbidden, "Blocked due to rate limit or blacklisted."));
            return;
        }

        const cidrRemoteAddress = cidr(`${ip}/24`);
        const sameSubnetSockets = Object.values({ ...this.scServer.clients, ...this.scServer.pendingClients }).filter(
            client => cidr(`${client.remoteAddress}/24`) === cidrRemoteAddress,
        );
        if (sameSubnetSockets.length > this.config.maxSameSubnetPeers) {
            req.socket.destroy();
            return;
        }

        next();
    }

    private async handleEmit(req, next): Promise<void> {
        if (await this.rateLimiter.hasExceededRateLimit(req.socket.remoteAddress, req.event)) {
            if (await this.rateLimiter.isBlocked(req.socket.remoteAddress)) {
                req.socket.terminate();
                return;
            }

            return next(this.createError(SocketErrors.RateLimitExceeded, "Rate limit exceeded"));
        }

        // @TODO: check if this is still needed
        if (!req.data) {
            return next(this.createError(SocketErrors.HeadersRequired, "Request data and is mandatory"));
        }

        try {
            if (req.event.length > 128) {
                req.socket.disconnect(4413, "Payload Too Large");
                return;
            }

            const [prefix, version, handler] = req.event.split(".");

            if (prefix !== "p2p") {
                req.socket.disconnect(4404, "Not Found");
                return;
            }

            // Check that blockchain, tx-pool and p2p are ready
            const isAppReady: any = await this.sendToMasterAsync("p2p.utils.isAppReady");

            for (const [plugin, ready] of Object.entries(isAppReady.data)) {
                if (!ready) {
                    return next(this.createError(SocketErrors.AppNotReady, `${plugin} isn't ready!`));
                }
            }

            if (version === "internal") {
                const { data } = await this.sendToMasterAsync("p2p.utils.isForgerAuthorized", {
                    data: { ip: req.socket.remoteAddress },
                });

                if (!data.authorized) {
                    req.socket.terminate();
                    return;
                }
            } else if (version === "peer") {
                const requestSchema = requestSchemas.peer[handler];
                if (["postTransactions", "postBlock"].includes(handler)) {
                    // has to be in the peer list to use the endpoint
                    const {
                        data: { isPeerOrForger },
                    } = await this.sendToMasterAsync("p2p.internal.isPeerOrForger", {
                        data: { ip: req.socket.remoteAddress },
                    });
                    if (!isPeerOrForger) {
                        req.socket.terminate();
                        return;
                    }
                } else if (requestSchema && !ajv.validate(requestSchema, req.data.data)) {
                    req.socket.terminate();
                    return;
                }

                this.sendToMasterAsync("p2p.internal.acceptNewPeer", {
                    data: { ip: req.socket.remoteAddress },
                    headers: req.data.headers,
                });
            } else {
                req.socket.disconnect(4400, "Bad Request");
                return;
            }

            // some handlers need this remoteAddress info
            // req.data is socketcluster request data, which corresponds to our own "request" object
            // which is like this { endpoint, data, headers }
            req.data.headers.remoteAddress = req.socket.remoteAddress;
        } catch (e) {
            this.log(e.message, "error");

            if (e.name === SocketErrors.Validation) {
                return next(e);
            }

            return next(this.createError(SocketErrors.Unknown, "Unknown error"));
        }

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

    private createError(name, message): Error {
        const error: Error = new Error(message);
        error.name = name;

        return error;
    }
}

// tslint:disable-next-line
new Worker();
