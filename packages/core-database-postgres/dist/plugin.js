"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_database_1 = require("@arkecosystem/core-database");
const core_state_1 = require("@arkecosystem/core-state");
const defaults_1 = require("./defaults");
const postgres_connection_1 = require("./postgres-connection");
exports.plugin = {
    pkg: require("../package.json"),
    defaults: defaults_1.defaults,
    required: true,
    alias: "database",
    extends: "@arkecosystem/core-database",
    async register(container, options) {
        container.resolvePlugin("logger").info("Establishing Database Connection");
        const walletManager = new core_state_1.Wallets.WalletManager();
        const connectionManager = container.resolvePlugin("database-manager");
        const connection = await connectionManager.createConnection(new postgres_connection_1.PostgresConnection(options, walletManager));
        return core_database_1.databaseServiceFactory(options, walletManager, connection);
    },
    async deregister(container, options) {
        container.resolvePlugin("logger").info("Closing Database Connection");
        await container.resolvePlugin("database").connection.disconnect();
    },
};
//# sourceMappingURL=plugin.js.map