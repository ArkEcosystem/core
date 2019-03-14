import { app } from "@arkecosystem/core-container";
import { Logger } from "@arkecosystem/core-interfaces";
import { NetworkState, NetworkStateStatus, socketEmit } from "@arkecosystem/core-p2p";
import delay from "delay";
import sample from "lodash/sample";
import socketCluster from "socketcluster-client";

export class Client {
    public hosts: any[];

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

        if (!port || !ip) {
            throw new Error("Failed to determine the P2P communication port / ip.");
        }

        this.hosts.forEach(
            host =>
                (host.socket = socketCluster.create({
                    port: host.port,
                    hostname: host.ip,
                })),
        );

        this.host = this.hosts[0];

        this.headers = {
            version: app.getVersion(),
            port,
            nethash: app.getConfig().get("network.nethash"),
            "Content-Type": "application/json",
        };
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
            } transactions to ${this.host.ip}`,
        );

        let response;
        try {
            response = this.emit("p2p.internal.storeBlock", { block });
        } catch (error) {
            this.logger.error(`Broadcast block failed: ${error.message}`);
        }
        return response;
    }

    /**
     * Sends the WAKEUP signal to the to relay hosts to check if synced and sync if necesarry
     */
    public async syncCheck() {
        await this.__chooseHost();

        this.logger.debug(`Sending wake-up check to relay node ${this.host.ip}`);

        try {
            await this.emit("p2p.internal.syncBlockchain", {});
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

            return NetworkState.parse(response.data);
        } catch (e) {
            this.logger.error(
                `Could not retrieve network state: ${this.host.ip} p2p.internal.getNetworkState : ${e.message}`,
            );
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

        if (host.socket.getState() !== host.socket.OPEN) {
            this.logger.debug(`${host.ip} socket is not open. Trying another host`);

            if (wait > 0) {
                await delay(wait);
            }

            await this.__chooseHost(wait);
        } else {
            this.host = host;
        }
    }

    private async emit(event: string, data: any, timeout: number = 2000) {
        const response: any = await socketEmit(this.host.socket, event, data, this.headers, timeout);
        return response.data;
    }
}
