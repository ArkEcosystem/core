import { Container, Contracts, Providers, Services, Utils } from "@arkecosystem/core-kernel";
import { Managers } from "@arkecosystem/crypto";

type PluginConfig = { package: string; options: any };

const transformPlugins = (plugins: PluginConfig[]): Contracts.P2P.PeerPlugins => {
    const result: Contracts.P2P.PeerPlugins = {};

    for (const pluginConfig of plugins) {
        const name = pluginConfig.package;
        const options =
            pluginConfig.options?.server?.http ||
            pluginConfig.options?.server?.https ||
            pluginConfig.options?.server ||
            pluginConfig.options ||
            {}; // lots of options for server configuration... TODO review see if it can be cleaner

        const port = Number(options.port);

        if (isNaN(port) || name.includes("core-p2p")) {
            continue;
        }

        result[name] = {
            enabled: true, // default to true because "enabled" flag is in different place based on which plugin
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

        const hasDefaults: boolean = Object.keys(serviceProvider.configDefaults()).length > 0;

        if (hasDefaults) {
            const pluginConfig = {
                package: plugin.package,
                options: app
                    .resolve(Providers.PluginConfiguration)
                    .from(serviceProviderName, serviceProvider.configDefaults())
                    .merge(plugin.options || {})
                    .all(),
            };
            return pluginConfig;
        }

        const pluginConfig = {
            package: plugin.package,
            options: app
                .resolve(Providers.PluginConfiguration)
                .discover(serviceProviderName)
                .merge(plugin.options || {})
                .all(),
        };
        return pluginConfig;
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
