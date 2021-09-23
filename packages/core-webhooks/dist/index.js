"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("./database");
const defaults_1 = require("./defaults");
const listener_1 = require("./listener");
const server_1 = require("./server");
exports.plugin = {
    pkg: require("../package.json"),
    defaults: defaults_1.defaults,
    alias: "webhooks",
    async register(container, options) {
        if (!options.enabled) {
            container.resolvePlugin("logger").info("Webhooks are disabled");
            return undefined;
        }
        database_1.database.make();
        listener_1.startListeners();
        return server_1.startServer(options.server);
    },
    async deregister(container, options) {
        if (options.enabled) {
            container.resolvePlugin("logger").info("Stopping Webhook API");
            await container.resolvePlugin("webhooks").stop();
        }
    },
};
//# sourceMappingURL=index.js.map