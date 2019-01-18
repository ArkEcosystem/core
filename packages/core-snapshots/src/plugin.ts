import { PostgresConnection } from "@arkecosystem/core-database-postgres";
import { Container } from "@arkecosystem/core-interfaces";
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

        return manager.make(container.resolvePlugin<PostgresConnection>("database"));
    },
};
