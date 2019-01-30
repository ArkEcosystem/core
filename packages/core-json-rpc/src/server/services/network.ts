import { app, Contracts } from "@arkecosystem/core-kernel";
import { configManager } from "@arkecosystem/crypto";
import axios from "axios";
import isReachable from "is-reachable";
import sample from "lodash/sample";

class Network {
    public p2p: Contracts.P2P.IMonitor;
    public config: any;
    public network: any;
    public client: any;
    public peers: any;
    public server: any;

    public async init() {
        this.config = app.getConfig();
        this.p2p = app.p2p;

        this.network = configManager.all();

        this.loadRemotePeers();

        this.client = axios.create({
            headers: {
                Accept: "application/vnd.core-api.v2+json",
                "Content-Type": "application/json",
            },
            timeout: 3000,
        });
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
            app.logger.info(`Sending request on "${this.network.name}" to "${uri}"`);

            const response = await this.client.get(uri, { params });

            return response.data;
        } catch (error) {
            app.logger.error(error.message);
        }
    }

    public async broadcast(transaction) {
        return this.client.post(`http://${this.server.ip}:${this.server.port}/api/transactions`, {
            transactions: [transaction],
        });
    }

    public async connect(): Promise<any> {
        if (this.server) {
            // app.logger.info(`Server is already configured as "${this.server.ip}:${this.server.port}"`)
            return true;
        }

        this.setServer();

        try {
            const peerPort = app.config("p2p").port;
            const response = await axios.get(`http://${this.server.ip}:${peerPort}/config`);

            const plugin = response.data.data.plugins["@arkecosystem/core-api"];

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
            this.network.name === "testnet" ? [{ ip: "127.0.0.1", port: app.config("api").port }] : this.p2p.getPeers();

        if (!this.peers.length) {
            app.logger.error("No peers found. Shutting down...");
            process.exit();
        }
    }

    private async selectResponsivePeer(peer) {
        const reachable = await isReachable(`${peer.ip}:${peer.port}`);

        if (!reachable) {
            app.logger.warn(`${peer} is unresponsive. Choosing new peer.`);

            return this.selectResponsivePeer(this.getRandomPeer());
        }

        return peer;
    }
}

export const network = new Network();
