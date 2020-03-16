import "jest-extended";

import { Application, Container, Providers } from "@arkecosystem/core-kernel";
import { initApp } from "./__support__";
import { Server } from "@arkecosystem/core-api/src/server";
import { preparePlugins } from "@arkecosystem/core-api/src/plugins";

let app: Application;

beforeEach(() => {
    app = initApp();
});

describe("Server", () => {
    let server: Server;
    let defaults: any;
    let serverConfig: any;

    beforeEach(() => {
        app.bind(Server).to(Server);
        server = app.get(Server);

        defaults = {
            plugins: {
                pagination: {
                    limit: 100,
                },
                whitelist: ["*"],
            },
        };

        serverConfig = {
            enabled: true,
            host: "0.0.0.0",
            port: 4003,
            routes: {
                cors: true
            }
        };

        let pluginConfiguration = app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration);
        const pluginConfigurationInstance: Providers.PluginConfiguration = pluginConfiguration.from("core-api", defaults);

        app.bind(Container.Identifiers.PluginConfiguration).toConstantValue(pluginConfigurationInstance)
            .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("plugin", "@arkecosystem/core-api"));
    });

    describe("initialize", () => {
        it("should be ok", async () => {
            await expect(server.initialize("Test", serverConfig)).toResolve();
        });

        it("should response with hello world", async () => {
            await expect(server.initialize("Test", serverConfig)).toResolve();

            const injectOptions = {
                method: 'GET',
                url: '/',
            };

            const response = await server.inject(injectOptions);
            const payload = JSON.parse(response.payload || {});

            expect(payload.data).toBe("Hello World!");
        });
    });

    describe("route", () => {
        it("should add custom route", async () => {
            await expect(server.initialize("Test", serverConfig)).toResolve();

            let testRoute = {
                method: 'GET',
                path: '/test',
                handler: () => 'ok'
            };

            expect(server.route(testRoute)).toResolve();

            const injectOptions = {
                method: 'GET',
                url: '/test',
            };

            const response = await server.inject(injectOptions);

            expect(response.payload).toBe("ok");
        });
    });

    describe("register", () => {
        it("should be ok", async () => {
            await expect(server.initialize("Test", serverConfig)).toResolve();

            await expect(server.register(preparePlugins(defaults.plugins))).toResolve();
        });
    });
});
