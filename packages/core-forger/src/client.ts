import { app } from "@arkecosystem/core-container";
import { Logger } from "@arkecosystem/core-interfaces";
import { NetworkState, NetworkStateStatus } from "@arkecosystem/core-p2p";
import axios from "axios";
import delay from "delay";
import sample from "lodash/sample";
import socketCluster from "socketcluster-client";
import { URL } from "url";

export class Client {
    public hosts: any[];
    public socket;

    private host: any;
    private headers: any;
    private logger: Logger.ILogger;

    /**
     * Create a new client instance.
     * @param  {(Array|String)} hosts - Host or Array of hosts
     */
    constructor(hosts) {
        this.hosts = Array.isArray(hosts) ? hosts : [hosts];
        this.logger = app.resolvePlugin<Logger.ILogger>("logger");

        const { port, ip } = this.hosts[0];

        if (!port) {
            throw new Error("Failed to determine the P2P communcation port.");
        }

        this.headers = {
            version: app.getVersion(),
            port,
            nethash: app.getConfig().get("network.nethash"),
            "x-auth": "forger",
            "Content-Type": "application/json",
        };

        this.socket = socketCluster.create({
            port,
            hostname: ip,
        });
    }

    /**
     * Send the given block to the relay.
     * @param  {(Block|Object)} block
     * @return {Object}
     */
    public async broadcast(block) {
        this.logger.debug(
            `Broadcasting forged block id:${block.id} at height:${block.height.toLocaleString()} with ${
                block.numberOfTransactions
            } transactions to ${this.host} :package:`,
        );

        return this.emit("p2p.internal.storeBlock", { block });
        // return this.__post(`${this.host}/internal/blocks`, { block });
    }

    /**
     * Sends the WAKEUP signal to the to relay hosts to check if synced and sync if necesarry
     */
    public async syncCheck() {
        await this.__chooseHost();

        this.logger.debug(`Sending wake-up check to relay node ${this.host}`);

        try {
            await this.emit("p2p.internal.syncBlockchain", {});
            // await this.__get(`${this.host}/internal/blockchain/sync`);
        } catch (error) {
            this.logger.error(`Could not sync check: ${error.message}`);
        }
    }

    /**
     * Get the current round.
     * @return {Object}
     */
    public async getRound() {
        try {
            await this.__chooseHost();

            const response: any = await this.emit("p2p.internal.getCurrentRound", {});
            // const response = await this.__get(`${this.host}/internal/rounds/current`);

            return response.data;
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
            const response: any = await this.emit("p2p.internal.getNetworkState", {});
            // const response = await this.__get(`${this.host}/internal/network/state`);

            return NetworkState.parse(response.data);
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
            const response: any = await this.emit("p2p.internal.getUnconfirmedTransactions", {});
            // const response = await this.__get(`${this.host}/internal/transactions/forging`);

            return response.data;
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
            const response: any = await this.emit("p2p.internal.getUsernames", {});
            // const response = await this.__get(`${this.host}/internal/utils/usernames`);

            return response.data;
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

        const host = this.hosts.find(item => allowedHosts.some(allowedHost => item.ip.includes(allowedHost)));

        if (!host) {
            return this.logger.error("Was unable to find any local hosts.");
        }

        try {
            await this.emit("p2p.internal.emitEvent", { event, body });
            // await this.__post(`${host}/internal/utils/events`, { event, body });
        } catch (error) {
            this.logger.error(`Failed to emit "${event}" to "${host}"`);
        }
    }

    /**
     * Chose a responsive host.
     * @return {void}
     */
    public async __chooseHost(wait = 0) {
        const host = sample(this.hosts);

        try {
            await this.emit("p2p.peer.getStatus", {});
            // await this.__get(`${host}/peer/status`);

            this.host = host;
        } catch (error) {
            this.logger.debug(`${host} didn't respond to the forger. Trying another host :sparkler:`);

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

    private async emit(event, data) {
        if (!data) {
            data = {};
        }
        const { ip } = this.hosts[0];
        data.info = {
            remoteAddress: ip,
        };
        data.headers = this.headers;

        this.logger.debug(`Sending socket message "${event}" to ${ip} : ${JSON.stringify(data, null, 2)}`);

        // if socket is not connected, we give it 1 second
        for (let i = 0; i < 10 && this.socket.getState() !== this.socket.OPEN; i++) {
            await delay(100);
        }
        if (this.socket.getState() !== this.socket.OPEN) {
            throw new Error(`Relay socket is not connected. State: ${this.socket.getState()}`);
        }

        return new Promise((resolve, reject) => {
            try {
                this.socket.emit(event, data, (err, val) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(val);
                    }
                });
            } catch (e) {
                reject(e);
            }
        });
    }
}
