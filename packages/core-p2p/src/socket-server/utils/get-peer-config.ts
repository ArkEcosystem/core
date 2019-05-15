import { app } from "@arkecosystem/core-container";
import { Plugins } from "@arkecosystem/core-utils";
import { IPeerConfig } from "../../interfaces";

export const getPeerConfig = (): IPeerConfig => {
    const appConfig = app.getConfig();

    return {
        version: app.getVersion(),
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
        plugins: Plugins.transformPlugins(appConfig.config.plugins),
    };
};
