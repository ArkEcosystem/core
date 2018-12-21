import { Container }  from "@arkecosystem/core-container";
import { defaults } from "./defaults";
import { SnapshotManager } from "./manager";

/**
 * The struct used by the plugin container.
 * @type {Object}
 */
export const plugin = {
    pkg: require("../package.json"),
    defaults,
    alias: "snapshots",
    async register(container: Container, options) {
        const manager = new SnapshotManager(options);

        return manager.make(container.resolvePlugin("database"));
    },
};
