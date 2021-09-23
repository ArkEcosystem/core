"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const defaults_1 = require("./defaults");
const service_1 = require("./service");
const blocks_1 = require("./stores/blocks");
const state_1 = require("./stores/state");
const transactions_1 = require("./stores/transactions");
exports.plugin = {
    pkg: require("../package.json"),
    defaults: defaults_1.defaults,
    required: true,
    alias: "state",
    async register() {
        return new service_1.StateService({
            blocks: new blocks_1.BlockStore(1000),
            transactions: new transactions_1.TransactionStore(1000),
            storage: new state_1.StateStore(),
        });
    },
};
//# sourceMappingURL=plugin.js.map