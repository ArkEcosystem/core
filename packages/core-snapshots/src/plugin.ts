import { PostgresConnection } from "@arkecosystem/core-database-postgres";
import { Contracts } from "@arkecosystem/core-kernel";
import { defaults } from "./defaults";
import { SnapshotManager } from "./manager";

/**
 * The struct used by the plugin container.
 * @type {Object}
 */
export const plugin: Container.IPluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "snapshots",
    async register(container: Contracts.Kernel.IContainer, options) {
        const manager = new SnapshotManager(options);

        const databaseService = container.resolve<Contracts.Database.IDatabaseService>("database");
        return manager.make(databaseService.connection as PostgresConnection);
    },
};
