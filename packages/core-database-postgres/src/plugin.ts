import { ConnectionManager, databaseServiceFactory } from "@arkecosystem/core-database";
import { Container, Database, Logger } from "@arkecosystem/core-interfaces";
import { Wallets } from "@arkecosystem/core-state";
import { defaults } from "./defaults";
import { PostgresConnection } from "./postgres-connection";

export const plugin: Container.IPluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "database",
    extends: "@arkecosystem/core-database",
    async register(container: Container.IContainer, options) {
        container.resolvePlugin<Logger.ILogger>("logger").info("Establishing Database Connection");

        const walletManager = new Wallets.WalletManager();

        const connectionManager = container.resolvePlugin<ConnectionManager>("database-manager");
        const connection = await connectionManager.createConnection(new PostgresConnection(options, walletManager));

        return databaseServiceFactory(options, walletManager, connection);
    },
    async deregister(container: Container.IContainer, options) {
        container.resolvePlugin<Logger.ILogger>("logger").info("Closing Database Connection");

        await container.resolvePlugin<Database.IDatabaseService>("database").connection.disconnect();
    },
};
