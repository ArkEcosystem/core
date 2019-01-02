import { app } from "@arkecosystem/core-container";
import { Logger, P2P } from "@arkecosystem/core-interfaces";
import { configManager } from "@arkecosystem/crypto";
import axios from "axios";
import isReachable from "is-reachable";
import sample from "lodash/sample";

class Network {
    public logger: Logger.ILogger;
    public p2p: P2P.IMonitor;
    public config: any;
    public network: any;
    public client: any;
    public peers: any;
    public server: any;

    public async init() {
        this.logger = app.resolvePlugin<Logger.ILogger>("logger");
        this.config = app.getConfig();
        this.p2p = app.resolvePlugin<P2P.IMonitor>("p2p");

        this.network = configManager.all();

        this.__loadRemotePeers();

        this.client = axios.create({
            headers: {
                Accept: "application/vnd.ark.core-api.v2+json",
                "Content-Type": "application/json",
            },
            timeout: 3000,
        });
    }

    public setServer() {
        this.server = this.__getRandomPeer();
    }

    public async sendRequest(url, params = {}) {
        if (!this.server) {
            this.setServer();
        }

        const peer = await this.__selectResponsivePeer(this.server);
        const uri = `http://${peer.ip}:${peer.port}/api/${url}`;

        try {
            this.logger.info(`Sending request on "${this.network.name}" to "${uri}"`);

            const response = await this.client.get(uri, { params });

            return response.data;
        } catch (error) {
            this.logger.error(error.message);
        }
    }

    public async broadcast(transaction) {
        return this.client.post(`http://${this.server.ip}:${this.server.port}/api/transactions`, {
            transactions: [transaction],
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
            const response = await axios.get(`http://${this.server.ip}:${peerPort}/config`);

            const plugin = response.data.data.plugins["@arkecosystem/core-api"];

            if (!plugin.enabled) {
                const index = this.peers.findIndex(peer => peer.ip === this.server.ip);
                this.peers.splice(index, 1);

                if (!this.peers.length) {
                    this.__loadRemotePeers();
                }

                return this.connect();
            }

            this.server.port = plugin.port;
        } catch (error) {
            return this.connect();
        }
    }

    public __getRandomPeer() {
        this.__loadRemotePeers();

        return sample(this.peers);
    }

    public __loadRemotePeers() {
        this.peers =
            this.network.name === "testnet"
                ? [{ ip: "127.0.0.1", port: app.resolveOptions("api").port }]
                : this.p2p.getPeers();

        if (!this.peers.length) {
            this.logger.error("No peers found. Shutting down...");
            process.exit();
        }
    }

    public async __selectResponsivePeer(peer) {
        const reachable = await isReachable(`${peer.ip}:${peer.port}`);

        if (!reachable) {
            this.logger.warn(`${peer} is unresponsive. Choosing new peer.`);

            return this.__selectResponsivePeer(this.__getRandomPeer());
        }

        return peer;
    }
}

export const network = new Network();
