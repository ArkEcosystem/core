import { app } from "@arkecosystem/core-kernel";
// import { Plugins } from "@arkecosystem/core-kernel";
import { Managers } from "@arkecosystem/crypto";

export const config = {
    async handler() {
        const appConfig = Managers.configManager;

        return {
            data: {
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
                // plugins: Plugins.transformPlugins(appConfig.config.plugins),
            },
        };
    },
    config: {
        cors: true,
    },
};
