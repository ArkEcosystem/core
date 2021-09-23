"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_utils_1 = require("@arkecosystem/core-utils");
const ip_1 = __importDefault(require("ip"));
const defaults_1 = require("./defaults");
const server_1 = require("./server");
exports.plugin = {
    pkg: require("../package.json"),
    defaults: defaults_1.defaults,
    alias: "wallet-api",
    depends: "@arkecosystem/core-api",
    async register(container, options) {
        if (!core_utils_1.isWhitelisted(container.resolveOptions("api").whitelist, ip_1.default.address())) {
            container.resolvePlugin("logger").info("Wallet API is disabled");
            return undefined;
        }
        return server_1.startServer(options.server);
    },
    async deregister(container, options) {
        try {
            container.resolvePlugin("logger").info("Stopping Wallet API");
            await container.resolvePlugin("wallet-api").stop();
        }
        catch (error) {
            // do nothing...
        }
    },
};
//# sourceMappingURL=plugin.js.map