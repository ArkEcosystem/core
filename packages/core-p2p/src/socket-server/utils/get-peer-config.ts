import { app } from "@arkecosystem/core-container";
import { IPeerConfig } from "../../interfaces";

export const getPeerConfig = (): IPeerConfig => {
    const transformPlugins = plugins => {
        const allowed: string[] = ["@arkecosystem/core-api"];

        const result: { [key: string]: { enabled: boolean; port: number } } = {};

        for (let [name, options] of Object.entries(plugins) as any) {
            if (allowed.includes(name)) {
                if (options.server) {
                    options = options.server;
                }

                result[name] = {
                    enabled: !!options.enabled,
                    port: +options.port,
                };
            }
        }

        return result;
    };

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
        plugins: transformPlugins(appConfig.config.plugins),
    };
};
