// import { Plugins } from "@arkecosystem/core-kernel";
import { CryptoManager } from "@arkecosystem/core-crypto";
import { Contracts } from "@arkecosystem/core-kernel";

export const getPeerConfig = (
    app: Contracts.Kernel.Application,
    cryptoManager: CryptoManager,
): Contracts.P2P.PeerConfig => {
    return {
        version: app.version(),
        network: {
            version: cryptoManager.NetworkConfigManager.get("network.pubKeyHash"),
            name: cryptoManager.NetworkConfigManager.get("network.name"),
            nethash: cryptoManager.NetworkConfigManager.get("network.nethash"),
            explorer: cryptoManager.NetworkConfigManager.get("network.client.explorer"),
            token: {
                name: cryptoManager.NetworkConfigManager.get("network.client.token"),
                symbol: cryptoManager.NetworkConfigManager.get("network.client.symbol"),
            },
        },
        plugins: {},
        // todo: review and re-enable
        // plugins: Plugins.transformPlugins(appConfig.config.plugins),
    };
};
