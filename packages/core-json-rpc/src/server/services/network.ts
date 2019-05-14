import { app } from "@arkecosystem/core-container";
import { Logger, P2P } from "@arkecosystem/core-interfaces";
import { Peer } from "@arkecosystem/core-p2p";
import { httpie } from "@arkecosystem/core-utils";
import { Interfaces, Managers } from "@arkecosystem/crypto";
import isReachable from "is-reachable";
import sample from "lodash.sample";

class Network {
    private readonly network: Interfaces.INetwork = Managers.configManager.get("network");
    private readonly logger: Logger.ILogger = app.resolvePlugin<Logger.ILogger>("logger");
    private readonly p2p: P2P.IPeerService = app.resolvePlugin<P2P.IPeerService>("p2p");

    public async sendGET({ path, query = {} }: { path: string; query?: Record<string, any> }) {
        return this.sendRequest("get", path, { query });
    }

    public async sendPOST({ path, body }: { path: string; body: Record<string, any> }) {
        return this.sendRequest("post", path, { body });
    }

    private async sendRequest(method: string, path: string, opts, tries: number = 0) {
        try {
            const peer: P2P.IPeer = await this.getPeer();
            const uri: string = `http://${peer.ip}:${peer.port}/api/${path}`;

            this.logger.info(`Sending request on "${this.network.name}" to "${uri}"`);

            return (await httpie[method](uri, {
                ...opts,
                ...{
                    headers: {
                        Accept: "application/vnd.core-api.v2+json",
                        "Content-Type": "application/json",
                    },
                    timeout: 3000,
                },
            })).body;
        } catch (error) {
            this.logger.error(error.message);

            if (tries > 3) {
                this.logger.error(`Failed to find a responsive peer after 3 tries.`);

                return undefined;
            }

            tries++;

            return this.sendRequest(method, path, opts, tries);
        }
    }

    private async getPeer(): Promise<P2P.IPeer> {
        const peer: P2P.IPeer = sample(this.getPeers());

        if (!(await isReachable(`${peer.ip}:${peer.port}`))) {
            this.logger.warn(`${peer} is unresponsive. Choosing new peer.`);

            return this.getPeer();
        }

        return peer;
    }

    private getPeers(): P2P.IPeer[] {
        let peers: P2P.IPeer[] = this.p2p.getStorage().getPeers();

        if (!peers.length && this.network.name === "testnet") {
            peers = [new Peer("127.0.0.1", app.resolveOptions("api").port)];
        }

        if (!peers.length) {
            throw new Error("No peers found.");
        }

        for (const peer of peers) {
            peer.port = app.resolveOptions("api").port;
        }

        return peers;
    }
}

export const network = new Network();
