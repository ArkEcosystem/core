import SCWorker from "socketcluster/scworker";
import { config } from "../config";
import { SocketErrors } from "../enums";
import { validateHeaders } from "./utils/validate-headers";

export class Worker extends SCWorker {
    private bannedPeers = {};
    private peersMsgTimestamps = {};
    private rateLimit = null; // will be then initialized from config
    private banDurationMs = null; // will be then initialized from config
    private ipWhitelist = []; // will be then initialized from config

    public run() {
        this.logInfo(`Socket worker started, PID: ${process.pid}`);

        const scServer = this.scServer;

        this.initRateLimit();

        scServer.on("connection", socket => this.registerEndpoints(socket));
        scServer.addMiddleware(scServer.MIDDLEWARE_HANDSHAKE_WS, (req, next) => this.middlewareHandshake(req, next));
        scServer.addMiddleware(scServer.MIDDLEWARE_EMIT, (req, next) => this.middlewareEmit(req, next));
    }

    public async initRateLimit() {
        const config: any = await this.sendToMasterAsync({
            endpoint: "p2p.init.getConfig",
        });

        if (config.rateLimit && config.rateLimit.enabled) {
            this.rateLimit = config.rateLimit.socketLimit;
            this.banDurationMs = config.rateLimit.banDurationMs;
            this.ipWhitelist = config.rateLimit.ipWhitelist;
        }
    }

    public async registerEndpoints(socket) {
        const handlers: any = await this.sendToMasterAsync({
            endpoint: "p2p.utils.getHandlers",
        });

        for (const name of handlers.data.peer) {
            socket.on(`p2p.peer.${name}`, async (data, res) =>
                this.forwardToMaster(Object.assign(data, { endpoint: `p2p.peer.${name}` }), res),
            );
        }

        for (const name of handlers.data.internal) {
            socket.on(`p2p.internal.${name}`, async (data, res) =>
                this.forwardToMaster(Object.assign(data, { endpoint: `p2p.internal.${name}` }), res),
            );
        }
    }

    public async middlewareHandshake(req, next): Promise<void> {
        if (config.get("blacklist", []).includes(req.ip)) {
            req.socket.disconnect(4403, "Forbidden");
            return;
        }

        if (this.isBanned(req.ip)) {
            return next(new Error("Banned because exceeded rate limit"));
        }

        next();
    }

    public async middlewareEmit(req, next): Promise<void> {
        const createError = (name, message) => {
            const err = new Error(message);
            err.name = name;
            return err;
        };

        if (!this.isRateLimitOk(req.socket.remoteAddress)) {
            this.banPeer(req.socket.remoteAddress);
            next(createError(SocketErrors.RateLimitExceeded, "Rate limit exceeded"));
            this.logError(`Rate limit exceeded from ${req.socket.remoteAddress} : banning and disconnecting socket.`);
            req.socket.disconnect(4429, "Rate limit exceeded");
            return;
        }

        // only allow requests with data and headers specified
        if (!req.data || !req.data.headers) {
            return next(createError(SocketErrors.HeadersRequired, "Request data and data.headers is mandatory"));
        }

        try {
            const [prefix, version, method] = req.event.split(".");
            if (prefix !== "p2p") {
                return next(createError(SocketErrors.WrongEndpoint, `Wrong endpoint : ${req.event}`));
            }

            // Validate headers
            const headersValidation = validateHeaders(req.data.headers);
            if (!headersValidation.valid) {
                return next(
                    createError(
                        SocketErrors.HeadersValidationFailed,
                        `Headers validation failed: ${headersValidation.errors.map(e => e.message).join()}`,
                    ),
                );
            }

            // Check that blockchain, tx-pool and monitor gard are ready
            const isAppReady: any = await this.sendToMasterAsync({
                endpoint: "p2p.utils.isAppReady",
            });
            for (const [plugin, ready] of Object.entries(isAppReady.data)) {
                if (!ready) {
                    return next(
                        createError(SocketErrors.AppNotReady, `Application is not ready : ${plugin} is not ready`),
                    );
                }
            }

            if (version === "internal") {
                // Only allow internal to whitelisted (remoteAccess) peer / forger
                const isForgerAuthorized: any = await this.sendToMasterAsync({
                    endpoint: "p2p.utils.isForgerAuthorized",
                    data: { ip: req.socket.remoteAddress },
                });
                if (!isForgerAuthorized.data) {
                    return next(
                        createError(
                            SocketErrors.ForgerNotAuthorized,
                            "Not authorized: internal endpoint is only available for whitelisted forger",
                        ),
                    );
                }
            } else if (version === "peer") {
                // here is where we can acceptNewPeer()
                await this.sendToMasterAsync({
                    endpoint: "p2p.peer.acceptNewPeer",
                    data: { ip: req.socket.remoteAddress },
                    headers: req.data.headers,
                });
            }

            // some handlers need this remoteAddress info
            // req.data is socketcluster request data, which corresponds to our own "request" object
            // which is like this { endpoint, data, headers }
            req.data.headers.remoteAddress = req.socket.remoteAddress;
        } catch (e) {
            // Log explicit error, return unknown error
            this.logError(e.message);

            // return explicit error when data validation error
            if (e.name === SocketErrors.Validation) {
                return next(e);
            }
            return next(createError(SocketErrors.Unknown, "Unknown error"));
        }
        next(); // Allow
    }

    public async sendToMasterAsync(data) {
        return new Promise((resolve, reject) => {
            this.sendToMaster(data, (err, val) => (err ? reject(err) : resolve(val)));
        });
    }

    public async forwardToMaster(data, res) {
        try {
            const masterResponse = await this.sendToMasterAsync(data);

            return res(null, masterResponse);
        } catch (e) {
            return res(e);
        }
    }

    private isRateLimitOk(peerIp): boolean {
        if (!this.rateLimit || !this.banDurationMs || this.ipWhitelist.includes(peerIp)) {
            return true;
        }

        this.peersMsgTimestamps[peerIp] = this.peersMsgTimestamps[peerIp] || [];
        this.peersMsgTimestamps[peerIp].push(new Date().getTime());
        const tsLength = this.peersMsgTimestamps[peerIp].length;
        if (tsLength < this.rateLimit) {
            return true;
        }
        this.peersMsgTimestamps[peerIp] = this.peersMsgTimestamps[peerIp].slice(tsLength - this.rateLimit);

        return this.peersMsgTimestamps[peerIp][this.rateLimit - 1] - this.peersMsgTimestamps[peerIp][0] > 1000;
    }

    private banPeer(peerIp): void {
        this.bannedPeers[peerIp] = new Date().getTime();
    }

    private isBanned(peerIp): boolean {
        if (!this.rateLimit || !this.banDurationMs) {
            return false;
        }

        if (this.bannedPeers[peerIp] && new Date().getTime() - this.bannedPeers[peerIp] > this.banDurationMs) {
            delete this.bannedPeers[peerIp];
        }

        return !!this.bannedPeers[peerIp];
    }

    private async logInfo(message): Promise<void> {
        try {
            await this.sendToMasterAsync({
                endpoint: "p2p.utils.logInfo",
                data: { message },
            });
        } catch (e) {
            // Fallback to console.error if we catched an error sending message to master
            console.error(`Error while trying to log the following message : ${message}`);
        }
    }

    private async logError(message): Promise<void> {
        try {
            await this.sendToMasterAsync({
                endpoint: "p2p.utils.logError",
                data: { message },
            });
        } catch (e) {
            // Fallback to console.error if we catched an error sending message to master
            console.error(`Error while trying to log the following error : ${message}`);
        }
    }
}

// tslint:disable-next-line
new Worker();
