import { Container, Contracts, Providers, Services, Utils } from "@arkecosystem/core-kernel";
import { Managers } from "@arkecosystem/crypto";

type PluginConfig = { package: string; options: any };

const transformPlugins = (plugins: PluginConfig[]): Contracts.P2P.PeerPlugins => {
    const result: Contracts.P2P.PeerPlugins = {};

    for (const pluginConfig of plugins) {
        const name = pluginConfig.package;
        // @README: This is a core specific convention. If a server should not be publicly discovered it should avoid this convention.
        const options = pluginConfig.options?.server?.http || pluginConfig.options?.server?.https || {};

        const port = Number(options.port);

        if (isNaN(port) || name.includes("core-p2p")) {
            continue;
        }

        result[name] = {
            enabled: typeof pluginConfig.options.enabled === "boolean" ? pluginConfig.options.enabled : true, // default to true because "enabled" flag is in different place based on which plugin
            port,
        };

        if (name.includes("core-api")) {
            result[name].estimateTotalCount = pluginConfig.options.options.estimateTotalCount;
        }
    }

    return result;
};

const getPluginsConfig = (plugins: PluginConfig[], app: Contracts.Kernel.Application) => {
    return plugins.map((plugin) => {
        const serviceProvider: Providers.ServiceProvider = app
            .get<Providers.ServiceProviderRepository>(Container.Identifiers.ServiceProviderRepository)
            .get(plugin.package);

        const serviceProviderName: string | undefined = serviceProvider.name();

        Utils.assert.defined<string>(serviceProviderName);

        return {
            package: plugin.package,
            options: serviceProvider.config().all(),
        };
    });
};

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
        plugins: transformPlugins(
            getPluginsConfig(
                app.get<Services.Config.ConfigRepository>(Container.Identifiers.ConfigRepository).get("app.plugins"),
                app,
            ),
        ),
    };
};
