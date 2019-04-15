import { app } from "@arkecosystem/core-container";
import { Logger, P2P } from "@arkecosystem/core-interfaces";
import { Peer } from "@arkecosystem/core-p2p";
import { httpie } from "@arkecosystem/core-utils";
import { Managers } from "@arkecosystem/crypto";
import isReachable from "is-reachable";
import sample from "lodash.sample";

class Network {
    private peers: P2P.IPeer[];
    private server: P2P.IPeer;
    private readonly network: any = Managers.configManager.all();
    private readonly logger: Logger.ILogger = app.resolvePlugin<Logger.ILogger>("logger");
    private readonly p2p: P2P.IPeerService = app.resolvePlugin<P2P.IPeerService>("p2p");
    private readonly requestOpts: Record<string, any> = {
        headers: {
            Accept: "application/vnd.core-api.v2+json",
            "Content-Type": "application/json",
        },
        timeout: 3000,
    };

    public async init(): Promise<void> {
        this.loadRemotePeers();
    }

    public setServer(): void {
        this.server = this.getRandomPeer();
    }

    public async sendRequest<T = any>({ url, query = {} }: { url: string; query?: Record<string, any> }): Promise<T> {
        if (!this.server) {
            this.setServer();
        }

        try {
            const peer: P2P.IPeer = await this.selectResponsivePeer(this.server);
            const uri: string = `http://${peer.ip}:${peer.port}/api/${url}`;

            this.logger.info(`Sending request on "${this.network.name}" to "${uri}"`);

            return (await httpie.get(uri, { query, ...this.requestOpts })).body;
        } catch (error) {
            this.logger.error(error.message);
        }

        return undefined;
    }

    public async broadcast(transaction): Promise<void> {
        await httpie.post(`http://${this.server.ip}:${this.server.port}/api/transactions`, {
            body: {
                transactions: [transaction],
            },
            ...this.requestOpts.headers,
        });
    }

    public async connect(): Promise<void> {
        if (this.server) {
            return;
        }

        this.setServer();

        try {
            const peerPort: number = app.resolveOptions("p2p").port;
            // @FIXME: this endpoint no longer exists
            const response = await httpie.get(`http://${this.server.ip}:${peerPort}/config`);

            const plugin = response.body.data.plugins["@arkecosystem/core-api"];

            if (!plugin.enabled) {
                const index: number = this.peers.findIndex(peer => peer.ip === this.server.ip);
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

    private getRandomPeer(): P2P.IPeer {
        this.loadRemotePeers();

        return sample(this.peers);
    }

    private loadRemotePeers(): void {
        if (this.network.name === "testnet") {
            this.peers = [new Peer("127.0.0.1", app.resolveOptions("api").port)];
        } else {
            this.peers = this.p2p.getStorage().getPeers();
        }

        if (!this.peers.length) {
            app.forceExit("No peers found. Shutting down...");
        }
    }

    private async selectResponsivePeer(peer): Promise<P2P.IPeer> {
        if (!(await isReachable(`${peer.ip}:${peer.port}`))) {
            this.logger.warn(`${peer} is unresponsive. Choosing new peer.`);

            return this.selectResponsivePeer(this.getRandomPeer());
        }

        return peer;
    }
}

export const network = new Network();
