import { ConnectionManager, databaseServiceFactory } from "@arkecosystem/core-database";
import { Contracts } from "@arkecosystem/core-kernel";
import { Wallets } from "@arkecosystem/core-state";
import { defaults } from "./defaults";
import { PostgresConnection } from "./postgres-connection";

export const plugin: Container.IPluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    required: true,
    alias: "database",
    extends: "@arkecosystem/core-database",
    async register(container: Contracts.Kernel.IContainer, options) {
        container.resolve<Contracts.Kernel.ILogger>("logger").info("Establishing Database Connection");

        const walletManager = new Wallets.WalletManager();

        const connectionManager = container.resolve<ConnectionManager>("database-manager");
        const connection = await connectionManager.createConnection(new PostgresConnection(options, walletManager));

        return databaseServiceFactory(options, walletManager, connection);
    },
    async deregister(container: Contracts.Kernel.IContainer, options) {
        container.resolve<Contracts.Kernel.ILogger>("logger").info("Closing Database Connection");

        await container.resolve<Contracts.Database.IDatabaseService>("database").connection.disconnect();
    },
};
