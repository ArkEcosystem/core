"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const defaults_1 = require("./defaults");
const server_1 = require("./server");
exports.plugin = {
    pkg: require("../package.json"),
    defaults: defaults_1.defaults,
    alias: "api",
    async register(container, options) {
        if (!options.enabled) {
            container.resolvePlugin("logger").info("Public API is disabled");
            return false;
        }
        const server = new server_1.Server(options);
        await server.start();
        return server;
    },
    async deregister(container, options) {
        if (options.enabled) {
            container.resolvePlugin("logger").info(`Stopping Public API`);
            await container.resolvePlugin("api").stop();
        }
    },
};
//# sourceMappingURL=plugin.js.map