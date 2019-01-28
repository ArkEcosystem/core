import {
    DatabaseManager, DatabaseService, DelegatesRepository,
    WalletManager, WalletsRepository
} from "@arkecosystem/core-database";
import { Container, Logger } from "@arkecosystem/core-interfaces";
import { defaults } from "./defaults";
import { PostgresConnection } from "./postgres-connection";

export const plugin: Container.PluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "database",
    extends: "@arkecosystem/core-database",
    async register(container: Container.IContainer, options) {
        container.resolvePlugin<Logger.ILogger>("logger").info("Establishing Database Connection");

        const walletManager = new WalletManager();

        const databaseManager = container.resolvePlugin<DatabaseManager>("databaseManager");

        const connection = await databaseManager.makeConnection(new PostgresConnection(options, walletManager));
        let databaseService: DatabaseService;
        const databaseServiceProvider = () => databaseService;
        databaseService = new DatabaseService(options, connection, walletManager, new WalletsRepository(databaseServiceProvider), new DelegatesRepository(databaseServiceProvider));
        return databaseService
    },
    async deregister(container: Container.IContainer, options) {
        container.resolvePlugin<Logger.ILogger>("logger").info("Closing Database Connection");

        const connection = container.resolvePlugin<PostgresConnection>("database");
        return connection.disconnect();
    },
};
