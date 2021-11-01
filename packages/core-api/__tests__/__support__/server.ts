import { Server } from "@packages/core-api/src";
import { preparePlugins } from "@packages/core-api/src/plugins";
import { Application, Container, Providers } from "@packages/core-kernel";

export const initServer = async (app: Application, defaults: any, customRoute?: any): Promise<Server> => {
    const serverConfig = {
        enabled: true,
        host: "0.0.0.0",
        port: 4003,
        routes: {
            cors: true,
        },
    };

    app.bind(Server).to(Server);
    const server = app.get(Server);
    // @ts-ignore
    server.app.app = app;

    const pluginConfiguration = app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration);
    const pluginConfigurationInstance: Providers.PluginConfiguration = pluginConfiguration.from("core-api", defaults);

    app.bind(Container.Identifiers.PluginConfiguration)
        .toConstantValue(pluginConfigurationInstance)
        .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("plugin", "@arkecosystem/core-api"));

    await server.initialize("Test", serverConfig);
    await server.register(preparePlugins(defaults.plugins));

    if (customRoute) {
        await server.route(customRoute);
    }

    return server;
};
