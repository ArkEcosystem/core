"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const core_p2p_1 = require("@arkecosystem/core-p2p");
const crypto_1 = require("@arkecosystem/crypto");
const delay_1 = __importDefault(require("delay"));
const socketcluster_client_1 = __importDefault(require("socketcluster-client"));
const errors_1 = require("./errors");
class Client {
    constructor(hosts) {
        this.logger = core_container_1.app.resolvePlugin("logger");
        this.hosts = hosts.map(host => {
            host.socket = socketcluster_client_1.default.create({
                ...host,
                autoReconnectOptions: {
                    initialDelay: 1000,
                    maxDelay: 1000,
                },
                codecEngine: core_p2p_1.codec,
            });
            host.socket.on("error", err => {
                if (err.message !== "Socket hung up") {
                    this.logger.error(err.message);
                }
            });
            return host;
        });
        this.host = this.hosts[0];
    }
    async broadcastBlock(block) {
        this.logger.debug(`Broadcasting block ${block.data.height.toLocaleString()} (${block.data.id}) with ${block.data.numberOfTransactions} transactions to ${this.host.hostname}`);
        try {
            await this.emit("p2p.peer.postBlock", {
                block: crypto_1.Blocks.Block.serializeWithTransactions({
                    ...block.data,
                    transactions: block.transactions.map(tx => tx.data),
                }),
            });
        }
        catch (error) {
            this.logger.error(`Broadcast block failed: ${error.message}`);
        }
    }
    async syncWithNetwork() {
        await this.selectHost();
        this.logger.debug(`Sending wake-up check to relay node ${this.host.hostname}`);
        try {
            await this.emit("p2p.internal.syncBlockchain");
        }
        catch (error) {
            this.logger.error(`Could not sync check: ${error.message}`);
        }
    }
    async getRound() {
        await this.selectHost();
        return this.emit("p2p.internal.getCurrentRound");
    }
    async getNetworkState() {
        try {
            return core_p2p_1.NetworkState.parse(await this.emit("p2p.internal.getNetworkState", {}, 4000));
        }
        catch (err) {
            return new core_p2p_1.NetworkState(core_p2p_1.NetworkStateStatus.Unknown);
        }
    }
    async getTransactions() {
        return this.emit("p2p.internal.getUnconfirmedTransactions");
    }
    async emitEvent(event, body) {
        // NOTE: Events need to be emitted to the localhost. If you need to trigger
        // actions on a remote host based on events you should be using webhooks
        // that get triggered by the events you wish to react to.
        const allowedHosts = ["127.0.0.1", "::ffff:127.0.0.1"];
        const host = this.hosts.find(item => allowedHosts.some(allowedHost => item.hostname.includes(allowedHost)));
        if (!host) {
            this.logger.error("emitEvent: unable to find any local hosts.");
            return;
        }
        try {
            await this.emit("p2p.internal.emitEvent", { event, body });
        }
        catch (error) {
            this.logger.error(`Failed to emit "${event}" to "${host.hostname}:${host.port}"`);
        }
    }
    async selectHost() {
        for (let i = 0; i < 10; i++) {
            for (const host of this.hosts) {
                if (host.socket.getState() === host.socket.OPEN) {
                    this.host = host;
                    return;
                }
            }
            await delay_1.default(100);
        }
        this.logger.debug(`No open socket connection to any host: ${JSON.stringify(this.hosts.map(host => `${host.hostname}:${host.port}`))}.`);
        throw new errors_1.HostNoResponseError(this.hosts.map(host => host.hostname).join());
    }
    async emit(event, data = {}, timeout = 4000) {
        try {
            const response = await core_p2p_1.socketEmit(this.host.hostname, this.host.socket, event, data, {
                "Content-Type": "application/json",
            }, timeout);
            return response.data;
        }
        catch (error) {
            throw new errors_1.RelayCommunicationError(`${this.host.hostname}:${this.host.port}<${event}>`, error.message);
        }
    }
}
exports.Client = Client;
//# sourceMappingURL=client.js.map