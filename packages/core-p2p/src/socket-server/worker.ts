import SCWorker from "socketcluster/scworker";

class Worker extends SCWorker {
    public run() {
        console.log(`   >> Worker PID: ${process.pid}`);

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
            endpoint: "config.getHandlers",
        });

        for (const name of handlers.peer) {
            socket.on(`p2p.peer.${name}`, async (data, res) =>
                self.forwardToMaster(Object.assign(data, { endpoint: `p2p.peer.${name}` }), res),
            );
        }

        for (const name of handlers.internal) {
            socket.on(`p2p.internal.${name}`, async (data, res) =>
                self.forwardToMaster(Object.assign(data, { endpoint: `p2p.internal.${name}` }), res),
            );
        }
    }

    public async middleware(req, next) {
        // only allow requests with data and headers specified
        console.log(JSON.stringify(req.data, null, 2));
        if (req.data && req.data.headers) {
            try {
                const [prefix, version, method] = req.event.split(".");
                if (prefix !== "p2p") {
                    throw new Error("Wrong socket event prefix");
                }

                if (version === "internal") {
                    // TODO
                }

                if (version === "peer") {
                    // here is where we can acceptNewPeer()
                    await this.sendToMasterAsync({
                        endpoint: "p2p.peer.acceptNewPeer",
                        ip: req.socket.remoteAddress,
                        headers: req.data.headers,
                    });
                }
            } catch (e) {
                // TODO explicit error
                next(e);
            }
            next(); // Allow
        } else {
            const err = new Error("Request data and data.headers is mandatory");
            next(err);
        }
    }

    public async sendToMasterAsync(data) {
        const self: any = this;
        return new Promise((resolve, reject) => {
            self.sendToMaster(data, (err, val) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(val);
                }
            });
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
}

// tslint:disable-next-line
new Worker();
