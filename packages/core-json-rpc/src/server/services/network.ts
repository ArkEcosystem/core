import { app } from "@arkecosystem/core-container";
import { Logger, P2P } from "@arkecosystem/core-interfaces";
import { httpie } from "@arkecosystem/core-utils";
import { configManager } from "@arkecosystem/crypto";
import isReachable from "is-reachable";
import sample from "lodash.sample";

class Network {
    private readonly network: any = configManager.all();
    private readonly logger: Logger.ILogger = app.resolvePlugin<Logger.ILogger>("logger");
    private readonly p2p: P2P.IMonitor = app.resolvePlugin<P2P.IMonitor>("p2p");

    public async sendGET(path, query = {}) {
        return this.sendRequest("get", path, { query });
    }

    public async sendPOST(path, body) {
        return this.sendRequest("post", path, { body });
    }

    private async sendRequest(method, url, opts, tries = 0) {
        try {
            const peer: { ip: string; port: number } = await this.getPeer();
            const uri: string = `http://${peer.ip}:${peer.port}/api/${url}`;

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

            return this.sendRequest(method, url, opts, tries);
        }
    }

    private async getPeer(): Promise<{ ip: string; port: number }> {
        const peer: { ip: string; port: number } = sample(this.getPeers());
        const reachable: boolean = await isReachable(`${peer.ip}:${peer.port}`);

        if (!reachable) {
            this.logger.warn(`${peer} is unresponsive. Choosing new peer.`);

            return this.getPeer();
        }

        return peer;
    }

    private getPeers(): Array<{ ip: string; port: number }> {
        const peers =
            this.network.name === "testnet"
                ? [{ ip: "localhost", port: app.resolveOptions("api").port }]
                : this.p2p.getPeers();

        if (!peers.length) {
            throw new Error("No peers found. Shutting down...");
        }

        for (const peer of peers) {
            peer.port = app.resolveOptions("api").port;
        }

        return peers;
    }
}

export const network = new Network();
