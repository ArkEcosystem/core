"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const exchange_json_rpc_1 = require("@arkecosystem/exchange-json-rpc");
const defaults_1 = require("./defaults");
exports.plugin = {
    pkg: require("../package.json"),
    defaults: defaults_1.defaults,
    alias: "exchange-json-rpc",
    async register(container, options) {
        if (!options.enabled) {
            container.resolvePlugin("logger").info("Exchange JSON-RPC Server is disabled");
            return undefined;
        }
        options.network = crypto_1.Managers.configManager.get("network.name");
        return exchange_json_rpc_1.start({
            database: options.database,
            server: options,
            logger: container.resolvePlugin("logger"),
        });
    },
    async deregister(container, options) {
        if (options.enabled) {
            container.resolvePlugin("logger").info("Stopping Exchange JSON-RPC Server");
            return container.resolvePlugin("exchange-json-rpc").stop();
        }
    },
};
//# sourceMappingURL=index.js.map