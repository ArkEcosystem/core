"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const defaults_1 = require("./defaults");
const server_1 = require("./server");
exports.plugin = {
    pkg: require("../package.json"),
    defaults: defaults_1.defaults,
    alias: "vote-report",
    async register(container, options) {
        return server_1.startServer(options);
    },
    async deregister(container) {
        await container.resolvePlugin("vote-report").stop();
    },
};
//# sourceMappingURL=index.js.map