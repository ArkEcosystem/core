import { Container } from "@arkecosystem/core-container";
import { AbstractLogger } from "@arkecosystem/core-logger";
import { PostgresConnection } from "./connection";
import { defaults } from "./defaults";
import { migrations } from "./migrations";

/**
 * The struct used by the plugin container.
 * @type {Object}
 */
export const plugin = {
    pkg: require("../package.json"),
    defaults,
    alias: "database",
    extends: "@arkecosystem/core-database",
    async register(container: Container, options) {
        container.resolvePlugin<AbstractLogger>("logger").info("Establishing Database Connection");

        const postgres = new PostgresConnection(options);

        const databaseManager = container.resolvePlugin("databaseManager");
        await databaseManager.makeConnection(postgres);

        return databaseManager.connection();
    },
    async deregister(container: Container, options) {
        container.resolvePlugin<AbstractLogger>("logger").info("Closing Database Connection");

        return container.resolvePlugin("database").disconnect();
    },
};

/**
 * The files required to migrate the database.
 * @type {Array}
 */
export { migrations };
