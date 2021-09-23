"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("./client");
const defaults_1 = require("./defaults");
const indices_1 = require("./indices");
const server_1 = require("./server");
exports.plugin = {
    pkg: require("../package.json"),
    defaults: defaults_1.defaults,
    alias: "elasticsearch",
    async register(container, options) {
        if (typeof options.client !== "object" ||
            Array.isArray(options.client) ||
            typeof options.chunkSize !== "number") {
            throw new Error("Elasticsearch plugin config invalid");
        }
        await client_1.client.setUp(options.client);
        await indices_1.watchIndices(options.chunkSize);
        return server_1.startServer(options.server);
    },
    async deregister(container) {
        return container.resolvePlugin("elasticsearch").stop();
    },
};
//# sourceMappingURL=index.js.map