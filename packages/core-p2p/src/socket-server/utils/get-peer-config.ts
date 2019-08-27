import { app } from "@arkecosystem/core-kernel";
// import { Plugins } from "@arkecosystem/core-utils";
import { Managers } from "@arkecosystem/crypto";
import { PeerConfig } from "../../interfaces";

export const getPeerConfig = (): PeerConfig => {
    const appConfig = Managers.configManager;

    return {
        version: app.version(),
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
        plugins: {},
        // plugins: Plugins.transformPlugins(appConfig.config.plugins),
    };
};
