import { Container } from "@arkecosystem/core-container";
import { DatabaseManager } from "@arkecosystem/core-database";
import { AbstractLogger } from "@arkecosystem/core-logger";
import { PostgresConnection } from "./connection";
import { defaults } from "./defaults";

export const plugin = {
    pkg: require("../package.json"),
    defaults,
    alias: "database",
    extends: "@arkecosystem/core-database",
    async register(container: Container, options) {
        container.resolvePlugin<AbstractLogger>("logger").info("Establishing Database Connection");

        const databaseManager = container.resolvePlugin<DatabaseManager>("databaseManager");
        return await databaseManager.makeConnection(new PostgresConnection(options));
    },
    async deregister(container: Container, options) {
        container.resolvePlugin<AbstractLogger>("logger").info("Closing Database Connection");

        const connection = container.resolvePlugin<PostgresConnection>("database");
        return connection.disconnect();
    },
};
