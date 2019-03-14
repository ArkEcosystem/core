import SCWorker from "socketcluster/scworker";
import { SocketErrors } from "./constants";
import { validateHeaders } from "./utils/validate-headers";

class Worker extends SCWorker {
    public run() {
        this.logInfo(`Socket worker started, PID: ${process.pid}`);

        const scServer = (this as any).scServer;
        const self = this;

        scServer.on("connection", socket => {
            self.registerEndpoints(socket);
        });

        scServer.addMiddleware(scServer.MIDDLEWARE_EMIT, (req, next) => this.middleware(req, next));
    }

    public async registerEndpoints(socket) {
        const self = this;

        const handlers: any = await this.sendToMasterAsync({
            endpoint: "p2p.utils.getHandlers",
        });

        for (const name of handlers.data.peer) {
            socket.on(`p2p.peer.${name}`, async (data, res) =>
                self.forwardToMaster(Object.assign(data, { endpoint: `p2p.peer.${name}` }), res),
            );
        }

        for (const name of handlers.data.internal) {
            socket.on(`p2p.internal.${name}`, async (data, res) =>
                self.forwardToMaster(Object.assign(data, { endpoint: `p2p.internal.${name}` }), res),
            );
        }
    }

    public async middleware(req, next) {
        const createError = (name, message) => {
            const err = new Error(message);
            err.name = name;
            return err;
        };

        // only allow requests with data and headers specified
        // TODO we log into error right now to have it in separate log, this needs to be deleted after dev
        this.logError(`Received message from ${req.socket.remoteAddress} : ${JSON.stringify(req.data, null, 2)}`);
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
        const self: any = this;
        return new Promise((resolve, reject) => {
            self.sendToMaster(data, (err, val) => (err ? reject(err) : resolve(val)));
        });
    }

    public async forwardToMaster(data, res) {
        try {
            const masterResponse = await this.sendToMasterAsync(data);

            // TODO we log into error right now to have it in separate log, this needs to be deleted after dev
            this.logError(`Sending response: ${JSON.stringify(masterResponse, null, 2)}`);
            return res(null, masterResponse);
        } catch (e) {
            return res(e);
        }
    }

    private async logInfo(message) {
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

    private async logError(message) {
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
