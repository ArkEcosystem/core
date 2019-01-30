import { app } from "@arkecosystem/core-kernel";
import { NetworkState, NetworkStateStatus } from "@arkecosystem/core-p2p";
import axios from "axios";
import delay from "delay";
import sample from "lodash/sample";
import { URL } from "url";

export class Client {
    public hosts: string[];
    private host: any;
    private headers: any;

    /**
     * Create a new client instance.
     * @param  {(Array|String)} hosts - Host or Array of hosts
     */
    constructor(hosts) {
        this.hosts = Array.isArray(hosts) ? hosts : [hosts];

        const { port } = new URL(this.hosts[0]);

        if (!port) {
            throw new Error("Failed to determine the P2P communcation port.");
        }

        this.headers = {
            version: app.version(),
            port,
            nethash: app.getConfig().get("network.nethash"),
            "x-auth": "forger",
            "Content-Type": "application/json",
        };
    }

    /**
     * Send the given block to the relay.
     * @param  {(Block|Object)} block
     * @return {Object}
     */
    public async broadcast(block) {
        app.logger.debug(
            `Broadcasting forged block id:${block.id} at height:${block.height.toLocaleString()} with ${
                block.numberOfTransactions
            } transactions to ${this.host} :package:`,
        );

        return this.__post(`${this.host}/internal/blocks`, { block });
    }

    /**
     * Sends the WAKEUP signal to the to relay hosts to check if synced and sync if necesarry
     */
    public async syncCheck() {
        await this.__chooseHost();

        app.logger.debug(`Sending wake-up check to relay node ${this.host}`);

        try {
            await this.__get(`${this.host}/internal/blockchain/sync`);
        } catch (error) {
            app.logger.error(`Could not sync check: ${error.message}`);
        }
    }

    /**
     * Get the current round.
     * @return {Object}
     */
    public async getRound() {
        try {
            await this.__chooseHost();

            const response = await this.__get(`${this.host}/internal/rounds/current`);

            return response.data.data;
        } catch (e) {
            return {};
        }
    }

    /**
     * Get the current network quorum.
     * @return {NetworkState}
     */
    public async getNetworkState(): Promise<NetworkState> {
        try {
            const response = await this.__get(`${this.host}/internal/network/state`);
            const { data } = response.data;

            return NetworkState.parse(data);
        } catch (e) {
            return new NetworkState(NetworkStateStatus.Unknown);
        }
    }

    /**
     * Get all transactions that are ready to be forged.
     * @return {Object}
     */
    public async getTransactions() {
        try {
            const response = await this.__get(`${this.host}/internal/transactions/forging`);

            return response.data.data;
        } catch (e) {
            return {};
        }
    }

    /**
     * Get a list of all active delegate usernames.
     * @return {Object}
     */
    public async getUsernames(wait = 0) {
        await this.__chooseHost(wait);

        try {
            const response = await this.__get(`${this.host}/internal/utils/usernames`);

            return response.data.data;
        } catch (e) {
            return {};
        }
    }

    /**
     * Emit the given event and payload to the local host.
     * @param  {String} event
     * @param  {Object} body
     * @return {Object}
     */
    public async emitEvent(event, body) {
        // NOTE: Events need to be emitted to the localhost. If you need to trigger
        // actions on a remote host based on events you should be using webhooks
        // that get triggered by the events you wish to react to.

        const allowedHosts = ["localhost", "127.0.0.1", "::ffff:127.0.0.1", "192.168.*"];

        const host = this.hosts.find(item => allowedHosts.some(allowedHost => item.includes(allowedHost)));

        if (!host) {
            return app.logger.error("Was unable to find any local hosts.");
        }

        try {
            await this.__post(`${host}/internal/utils/events`, { event, body });
        } catch (error) {
            app.logger.error(`Failed to emit "${event}" to "${host}"`);
        }
    }

    /**
     * Chose a responsive host.
     * @return {void}
     */
    public async __chooseHost(wait = 0) {
        const host = sample(this.hosts);

        try {
            await this.__get(`${host}/peer/status`);

            this.host = host;
        } catch (error) {
            app.logger.debug(`${host} didn't respond to the forger. Trying another host :sparkler:`);

            if (wait > 0) {
                await delay(wait);
            }

            await this.__chooseHost(wait);
        }
    }

    public async __get(url) {
        return axios.get(url, { headers: this.headers, timeout: 2000 });
    }

    public async __post(url, body) {
        return axios.post(url, body, { headers: this.headers, timeout: 2000 });
    }
}
