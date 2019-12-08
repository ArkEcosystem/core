// import { Plugins } from "@arkecosystem/core-kernel";
import { Contracts } from "@arkecosystem/core-kernel";
import { Managers } from "@arkecosystem/crypto";

export const getPeerConfig = (app: Contracts.Kernel.Application): Contracts.P2P.PeerConfig => {
    return {
        version: app.version(),
        network: {
            version: Managers.configManager.get("network.pubKeyHash"),
            name: Managers.configManager.get("network.name"),
            nethash: Managers.configManager.get("network.nethash"),
            explorer: Managers.configManager.get("network.client.explorer"),
            token: {
                name: Managers.configManager.get("network.client.token"),
                symbol: Managers.configManager.get("network.client.symbol"),
            },
        },
        plugins: {},
        // todo: review and re-enable
        // plugins: Plugins.transformPlugins(appConfig.config.plugins),
    };
};
