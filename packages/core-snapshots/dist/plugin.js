"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const defaults_1 = require("./defaults");
const manager_1 = require("./manager");
/**
 * The struct used by the plugin container.
 * @type {Object}
 */
exports.plugin = {
    pkg: require("../package.json"),
    defaults: defaults_1.defaults,
    alias: "snapshots",
    async register(container, options) {
        const manager = new manager_1.SnapshotManager(options);
        const databaseService = container.resolvePlugin("database");
        return manager.make(databaseService.connection);
    },
};
//# sourceMappingURL=plugin.js.map