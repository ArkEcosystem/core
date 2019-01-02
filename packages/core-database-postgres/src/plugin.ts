import { DatabaseManager } from "@arkecosystem/core-database";
import { Container, Logger } from "@arkecosystem/core-interfaces";
import { PostgresConnection } from "./connection";
import { defaults } from "./defaults";

export const plugin: Container.PluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "database",
    extends: "@arkecosystem/core-database",
    async register(container: Container.IContainer, options) {
        container.resolvePlugin<Logger.ILogger>("logger").info("Establishing Database Connection");

        const databaseManager = container.resolvePlugin<DatabaseManager>("databaseManager");
        return await databaseManager.makeConnection(new PostgresConnection(options));
    },
    async deregister(container: Container.IContainer, options) {
        container.resolvePlugin<Logger.ILogger>("logger").info("Closing Database Connection");

        const connection = container.resolvePlugin<PostgresConnection>("database");
        return connection.disconnect();
    },
};
