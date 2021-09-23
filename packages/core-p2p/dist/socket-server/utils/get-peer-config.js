"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const core_utils_1 = require("@arkecosystem/core-utils");
exports.getPeerConfig = () => {
    const appConfig = core_container_1.app.getConfig();
    return {
        version: core_container_1.app.getVersion(),
        network: {
            version: appConfig.get("network.pubKeyHash"),
            name: appConfig.get("network.name"),
            nethash: appConfig.get("network.nethash"),
            explorer: appConfig.get("network.client.explorer"),
            token: {
                name: appConfig.get("network.client.token"),
                symbol: appConfig.get("network.client.symbol"),
            },
        },
        plugins: core_utils_1.Plugins.transformPlugins(appConfig.config.plugins),
    };
};
//# sourceMappingURL=get-peer-config.js.map