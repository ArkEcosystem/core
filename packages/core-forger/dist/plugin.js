"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const defaults_1 = require("./defaults");
const manager_1 = require("./manager");
exports.plugin = {
    pkg: require("../package.json"),
    defaults: defaults_1.defaults,
    alias: "forger",
    async register(container, options) {
        const forgerManager = new manager_1.ForgerManager(options);
        await forgerManager.startForging(options.bip38, options.password);
        // Don't keep bip38 password in memory
        delete options.bip38;
        delete options.password;
        return forgerManager;
    },
    async deregister(container) {
        const forger = container.resolvePlugin("forger");
        if (forger) {
            container.resolvePlugin("logger").info("Stopping Forger Manager");
            return forger.stopForging();
        }
    },
};
//# sourceMappingURL=plugin.js.map