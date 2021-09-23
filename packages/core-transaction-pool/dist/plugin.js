"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = require("./connection");
const defaults_1 = require("./defaults");
const manager_1 = require("./manager");
const memory_1 = require("./memory");
const storage_1 = require("./storage");
const wallet_manager_1 = require("./wallet-manager");
exports.plugin = {
    pkg: require("../package.json"),
    defaults: defaults_1.defaults,
    required: true,
    alias: "transaction-pool",
    async register(container, options) {
        container.resolvePlugin("logger").info("Connecting to transaction pool");
        return new manager_1.ConnectionManager().createConnection(new connection_1.Connection({
            options,
            walletManager: new wallet_manager_1.WalletManager(),
            memory: new memory_1.Memory(options.maxTransactionAge),
            storage: new storage_1.Storage(),
        }));
    },
    async deregister(container) {
        container.resolvePlugin("logger").info("Disconnecting from transaction pool");
        return container.resolvePlugin("transaction-pool").disconnect();
    },
};
//# sourceMappingURL=plugin.js.map