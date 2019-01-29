import { PostgresConnection } from "@arkecosystem/core-database-postgres";
import { Container, Database } from "@arkecosystem/core-interfaces";
import { defaults } from "./defaults";
import { SnapshotManager } from "./manager";

/**
 * The struct used by the plugin container.
 * @type {Object}
 */
export const plugin: Container.PluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "snapshots",
    async register(container: Container.IContainer, options) {
        const manager = new SnapshotManager(options);

        const connection = container.resolvePlugin<Database.IDatabaseService>("database").connection as any;
        return manager.make(connection as PostgresConnection);
    },
};
