"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const peers_1 = require("@arkecosystem/peers");
const got_1 = __importDefault(require("got"));
const is_reachable_1 = __importDefault(require("is-reachable"));
const lodash_sample_1 = __importDefault(require("lodash.sample"));
const logger_1 = require("./logger");
class Network {
    async init(options) {
        this.options = options;
        const networkOrHost = this.options.peer
            ? `http://${this.options.peer}:${this.options.peerPort}/api/peers`
            : this.options.network;
        this.peerDiscovery = (await peers_1.PeerDiscovery.new({ networkOrHost })).withLatency(options.maxLatency);
        crypto_1.Managers.configManager.setFromPreset(options.network);
        this.checkForAip11Enabled();
    }
    async sendGET({ path, query = {} }) {
        return this.sendRequest("get", path, { query });
    }
    async sendPOST({ path, body = {} }) {
        return this.sendRequest("post", path, { body });
    }
    async getHeight() {
        return (await this.sendGET({ path: "blockchain" })).data.block.height;
    }
    async checkForAip11Enabled() {
        const height = await this.getHeight();
        crypto_1.Managers.configManager.setHeight(height);
        const milestone = crypto_1.Managers.configManager.getMilestone(height);
        if (!milestone.aip11) {
            setTimeout(() => this.checkForAip11Enabled(), milestone.blocktime * 1000);
        }
    }
    async sendRequest(method, url, options, tries = 0, useSeed = false) {
        try {
            const peer = await this.getPeer();
            const uri = `http://${peer.ip}:${peer.port}/api/${url}`;
            logger_1.logger.info(`Sending request on "${this.options.network}" to "${uri}"`);
            if (options.body && typeof options.body !== "string") {
                options.body = JSON.stringify(options.body);
            }
            const { body } = await got_1.default[method](uri, {
                ...options,
                ...{
                    headers: {
                        Accept: "application/vnd.core-api.v2+json",
                        "Content-Type": "application/json",
                    },
                    timeout: 3000,
                },
            });
            return JSON.parse(body);
        }
        catch (error) {
            logger_1.logger.error(error.message);
            tries++;
            if (tries > 2) {
                logger_1.logger.error(`Failed to find a responsive peer after 3 tries.`);
                return undefined;
            }
            return this.sendRequest(method, url, options, tries);
        }
    }
    async getPeer() {
        if (this.options.peer) {
            return { ip: this.options.peer, port: this.options.peerPort };
        }
        const peer = lodash_sample_1.default(await this.getPeers());
        const reachable = await is_reachable_1.default(`${peer.ip}:${peer.port}`);
        if (!reachable) {
            logger_1.logger.warn(`${peer.ip}:${peer.port} is unresponsive. Choosing new peer.`);
            return this.getPeer();
        }
        return { ip: peer.ip, port: peer.port };
    }
    async getPeers() {
        return this.peerDiscovery.findPeersWithPlugin("core-api");
    }
}
exports.network = new Network();
//# sourceMappingURL=network.js.map