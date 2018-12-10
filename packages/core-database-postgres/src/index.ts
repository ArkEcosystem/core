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
    async register(container, options) {
        container.resolvePlugin("logger").info("Establishing Database Connection");

        const postgres = new PostgresConnection(options);

        const databaseManager = container.resolvePlugin("databaseManager");
        await databaseManager.makeConnection(postgres);

        return databaseManager.connection();
    },
    async deregister(container, options) {
        container.resolvePlugin("logger").info("Closing Database Connection");

        return container.resolvePlugin("database").disconnect();
    },
};

/**
 * The files required to migrate the database.
 * @type {Array}
 */
export { migrations };
