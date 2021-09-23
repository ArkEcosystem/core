"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const blockchain_1 = require("./blockchain");
const defaults_1 = require("./defaults");
const blockchain_2 = require("./machines/blockchain");
const replay_1 = require("./replay");
/**
 * The struct used by the plugin container.
 * @type {Object}
 */
exports.plugin = {
    pkg: require("../package.json"),
    defaults: defaults_1.defaults,
    required: true,
    alias: "blockchain",
    async register(container, options) {
        let blockchain;
        if (options.replay) {
            blockchain = new replay_1.ReplayBlockchain();
        }
        else {
            blockchain = new blockchain_1.Blockchain(options);
        }
        container
            .resolvePlugin("state")
            .getStore()
            .reset(blockchain_2.blockchainMachine);
        if (!process.env.CORE_SKIP_BLOCKCHAIN && !options.replay) {
            await blockchain.start();
        }
        return blockchain;
    },
    async deregister(container) {
        await container.resolvePlugin("blockchain").stop();
    },
};
//# sourceMappingURL=plugin.js.map