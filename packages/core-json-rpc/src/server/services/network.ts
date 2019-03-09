import { app } from "@arkecosystem/core-container";
import { Logger, P2P } from "@arkecosystem/core-interfaces";
import { httpie } from "@arkecosystem/core-utils";
import { configManager } from "@arkecosystem/crypto";
import isReachable from "is-reachable";
import sample from "lodash/sample";

class Network {
    private peers: any;
    private server: any;

    private readonly network: any = configManager.all();
    private readonly logger: Logger.ILogger = app.resolvePlugin<Logger.ILogger>("logger");
    private readonly p2p: P2P.IMonitor = app.resolvePlugin<P2P.IMonitor>("p2p");

    private readonly requestOpts: Record<string, any> = {
        headers: {
            Accept: "application/vnd.core-api.v2+json",
            "Content-Type": "application/json",
        },
        timeout: 3000,
    };

    public async init() {
        this.loadRemotePeers();
    }

    public setServer() {
        this.server = this.getRandomPeer();
    }

    public async sendRequest(url, params = {}) {
        if (!this.server) {
            this.setServer();
        }

        const peer = await this.selectResponsivePeer(this.server);
        const uri = `http://${peer.ip}:${peer.port}/api/${url}`;

        try {
            this.logger.info(`Sending request on "${this.network.name}" to "${uri}"`);

            const response = await httpie.get(uri, { params, ...this.requestOpts });

            return response.body;
        } catch (error) {
            this.logger.error(error.message);
        }
    }

    public async broadcast(transaction) {
        return httpie.post(`http://${this.server.ip}:${this.server.port}/api/transactions`, {
            body: {
                transactions: [transaction],
            },
            ...this.requestOpts.headers,
        });
    }

    public async connect(): Promise<any> {
        if (this.server) {
            // this.logger.info(`Server is already configured as "${this.server.ip}:${this.server.port}"`)
            return true;
        }

        this.setServer();

        try {
            const peerPort = app.resolveOptions("p2p").port;
            const response = await httpie.get(`http://${this.server.ip}:${peerPort}/config`);

            const plugin = response.body.data.plugins["@arkecosystem/core-api"];

            if (!plugin.enabled) {
                const index = this.peers.findIndex(peer => peer.ip === this.server.ip);
                this.peers.splice(index, 1);

                if (!this.peers.length) {
                    this.loadRemotePeers();
                }

                return this.connect();
            }

            this.server.port = plugin.port;
        } catch (error) {
            return this.connect();
        }
    }

    private getRandomPeer() {
        this.loadRemotePeers();

        return sample(this.peers);
    }

    private loadRemotePeers() {
        this.peers =
            this.network.name === "testnet"
                ? [{ ip: "localhost", port: app.resolveOptions("api").port }]
                : this.p2p.getPeers();

        if (!this.peers.length) {
            this.logger.error("No peers found. Shutting down...");
            process.exit();
        }
    }

    private async selectResponsivePeer(peer) {
        const reachable = await isReachable(`${peer.ip}:${peer.port}`);

        if (!reachable) {
            this.logger.warn(`${peer} is unresponsive. Choosing new peer.`);

            return this.selectResponsivePeer(this.getRandomPeer());
        }

        return peer;
    }
}

export const network = new Network();
