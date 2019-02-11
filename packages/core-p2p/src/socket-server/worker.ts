import SCWorker from "socketcluster/scworker";

class Worker extends SCWorker {
    public run() {
        console.log(`   >> Worker PID: ${process.pid}`);

        const scServer = (this as any).scServer;

        const self = this;

        /*
        In here we handle our incoming realtime connections and listen for events.
        */
        scServer.on("connection", socket => {
            self.registerEndpoints(socket);
        });

        const middlewareFunction = async (req, next) => {
            // only allow requests with data and headers specified
            console.log(JSON.stringify(req.data, null, 2));
            if (req.data && req.data.headers) {
                try {
                    // here is where we can acceptNewPeer()
                    await self.sendToMasterAsync(
                        Object.assign(req.data, { endpoint: "p2p.peer.auth", ip: req.socket.remoteAddress }),
                    );
                } catch (e) {
                    // TODO explicit error
                    next(e);
                }
                next(); // Allow
            } else {
                const err = new Error("Request data and data.headers is mandatory");
                next(err);
            }
        };

        scServer.addMiddleware(scServer.MIDDLEWARE_EMIT, (req, next) => middlewareFunction(req, next));
    }

    public registerEndpoints(socket) {
        const self = this;

        const peerHandlers = {
            getPeers: true,
            getHeight: true,
            getCommonBlocks: true,
            getTransactions: true,
            getStatus: true,
            postBlock: true,
            postTransactions: true,
            getBlocks: true,
        };
        for (const name of Object.keys(peerHandlers)) {
            socket.on(`p2p.peer.${name}`, async (data, res) =>
                self.forwardToMaster(Object.assign(data, { endpoint: `p2p.peer.${name}` }), res),
            );
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
