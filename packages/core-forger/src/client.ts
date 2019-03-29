import { app } from "@arkecosystem/core-container";
import { Logger } from "@arkecosystem/core-interfaces";
import { NetworkState } from "@arkecosystem/core-p2p";
import { httpie } from "@arkecosystem/core-utils";
import { models } from "@arkecosystem/crypto";
import { URL } from "url";
import { HostNoResponseError, RelayCommunicationError } from "./errors";

export class Client {
    public hosts: string[];
    private host: string;
    private headers: {
        version: string;
        port: number;
        nethash: string;
        "x-auth": "forger";
        "Content-Type": "application/json";
    };

    private logger: Logger.ILogger;

    /**
     * Create a new client instance.
     * @param  {(Array|String)} hosts - Host or Array of hosts
     */
    constructor(hosts) {
        this.hosts = Array.isArray(hosts) ? hosts : [hosts];
        this.logger = app.resolvePlugin<Logger.ILogger>("logger");

        const { port } = new URL(this.hosts[0]);

        if (!port) {
            throw new Error("Failed to determine the P2P communcation port.");
        }

        this.headers = {
            version: app.getVersion(),
            port: +port,
            nethash: app.getConfig().get("network.nethash"),
            "x-auth": "forger",
            "Content-Type": "application/json",
        };
    }

    /**
     * Send the given block to the relay.
     */
    public async broadcast(block: models.IBlockData): Promise<any> {
        this.logger.debug(
            `Broadcasting forged block id:${block.id} at height:${block.height.toLocaleString()} with ${
                block.numberOfTransactions
            } transactions to ${this.host}`,
        );

        return this.post(`${this.host}/internal/blocks`, { block });
    }

    /**
     * Sends the WAKEUP signal to the to relay hosts to check if synced and sync if necesarry
     */
    public async syncCheck(): Promise<void> {
        this.logger.debug(`Sending wake-up check to relay node ${this.host}`);
        await this.get(`${this.host}/internal/blockchain/sync`);
    }

    /**
     * Get the current round.
     */
    public async getRound(): Promise<any> {
        await this.selectHost();
        const response = await this.get(`${this.host}/internal/rounds/current`);
        return response.body.data;
    }

    /**
     * Get the current network quorum.
     */
    public async getNetworkState(): Promise<NetworkState> {
        const response = await this.get(`${this.host}/internal/network/state`, 4000);
        return NetworkState.parse(response.body.data);
    }

    /**
     * Get all transactions that are ready to be forged.
     */
    public async getTransactions(): Promise<{ transactions?: string[]; poolSize?: number }> {
        const response = await this.get(`${this.host}/internal/transactions/forging`);
        return response.body.data;
    }

    /**
     * Emit the given event and payload to the local host.
     * @param  {String} event
     * @param  {Object} body
     * @return {Object}
     */
    public async emitEvent(event: string, body: any): Promise<void> {
        // NOTE: Events need to be emitted to the localhost. If you need to trigger
        // actions on a remote host based on events you should be using webhooks
        // that get triggered by the events you wish to react to.

        const allowedHosts = ["localhost", "127.0.0.1", "::ffff:127.0.0.1", "192.168.*"];

        const host = this.hosts.find(item => allowedHosts.some(allowedHost => item.includes(allowedHost)));

        if (!host) {
            return this.logger.error("Was unable to find any local hosts.");
        }

        await this.post(`${host}/internal/utils/events`, { event, body });
    }

    /**
     * Chose a responsive host.
     */
    public async selectHost(): Promise<void> {
        let queriedHosts = 0;
        for (const host of this.hosts) {
            try {
                await this.get(`${host}/peer/status`);
                this.host = host;
            } catch (error) {
                if (queriedHosts === this.hosts.length - 1) {
                    throw new HostNoResponseError(host);
                } else {
                    this.logger.warn(`Failed to get response from ${host}. Trying another host.`);
                }
            } finally {
                queriedHosts++;
            }
        }
    }

    private async get(url, timeout: number = 2000) {
        try {
            return httpie.get(url, { headers: this.headers, timeout });
        } catch (error) {
            throw new RelayCommunicationError(url, error.message);
        }
    }

    private async post(url, body) {
        try {
            return httpie.post(url, { body, headers: this.headers, timeout: 2000 });
        } catch (error) {
            throw new RelayCommunicationError(url, error.message);
        }
    }
}
