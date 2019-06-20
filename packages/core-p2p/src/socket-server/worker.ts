import SCWorker from "socketcluster/scworker";
import { SocketErrors } from "../enums";
import { RateLimiter } from "./rate-limiter";

export class Worker extends SCWorker {
    private config: Record<string, any>;
    private rateLimiter: RateLimiter;

    public async run() {
        this.log(`Socket worker started, PID: ${process.pid}`);

        await this.loadConfiguration();

        this.scServer.on("connection", socket => this.handleConnection(socket));
        this.scServer.addMiddleware(this.scServer.MIDDLEWARE_HANDSHAKE_WS, (req, next) =>
            this.handleHandshake(req, next),
        );
        this.scServer.addMiddleware(this.scServer.MIDDLEWARE_EMIT, (req, next) => this.handleEmit(req, next));
    }

    private async loadConfiguration(): Promise<void> {
        const { data } = await this.sendToMasterAsync("p2p.utils.getConfig");

        this.config = data;
        this.rateLimiter = new RateLimiter({
            whitelist: [...this.config.whitelist, ...this.config.remoteAccess],
            configurations: {
                global: {
                    rateLimit: this.config.rateLimit,
                },
                endpoints: [
                    {
                        rateLimit: 1,
                        endpoint: "p2p.peer.postBlock",
                    },
                    {
                        rateLimit: 1,
                        endpoint: "p2p.peer.getBlocks",
                    },
                    {
                        rateLimit: 5,
                        endpoint: "p2p.peer.getCommonBlocks",
                    },
                ],
            },
        });
    }

    private async handleConnection(socket): Promise<void> {
        const { data } = await this.sendToMasterAsync("p2p.utils.getHandlers");

        for (const [version, handlers] of Object.entries(data)) {
            for (const handler of Object.values(handlers)) {
                // @ts-ignore
                socket.on(`p2p.${version}.${handler}`, async (data, res) => {
                    try {
                        return res(undefined, await this.sendToMasterAsync(`p2p.${version}.${handler}`, data));
                    } catch (e) {
                        return res(e);
                    }
                });
            }
        }
    }

    private async handleHandshake(req, next): Promise<void> {
        if ((this.config.blacklist || []).includes(req.socket.remoteAddress)) {
            req.socket.disconnect(4403, "Forbidden");
            return;
        }

        next();
    }

    private async handleEmit(req, next): Promise<void> {
        if (await this.rateLimiter.hasExceededRateLimit(req.socket.remoteAddress, req.event)) {
            return next(this.createError(SocketErrors.RateLimitExceeded, "Rate limit exceeded"));
        }

        // @TODO: check if this is still needed
        if (!req.data) {
            return next(this.createError(SocketErrors.HeadersRequired, "Request data and is mandatory"));
        }

        try {
            const [prefix, version] = req.event.split(".");

            if (prefix !== "p2p") {
                return next(this.createError(SocketErrors.WrongEndpoint, `Wrong endpoint: ${req.event}`));
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
                    return next(
                        this.createError(
                            SocketErrors.ForgerNotAuthorized,
                            "Not authorized: internal endpoint is only available for whitelisted forger",
                        ),
                    );
                }
            } else if (version === "peer") {
                this.sendToMasterAsync("p2p.peer.acceptNewPeer", {
                    data: { ip: req.socket.remoteAddress },
                    headers: req.data.headers,
                });
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
