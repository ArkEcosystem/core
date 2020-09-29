import "jest-extended";

import { preparePlugins } from "@packages/core-api/src/plugins";
import { Server } from "@packages/core-api/src/server";
import { Application, Container, Providers } from "@packages/core-kernel";

import { initApp } from "./__support__";

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
                socketTimeout: 5000,
                whitelist: ["*"],
            },
        };

        serverConfig = {
            enabled: true,
            host: "0.0.0.0",
            port: 4003,
            routes: {
                cors: true,
            },
        };

        const pluginConfiguration = app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration);
        const pluginConfigurationInstance: Providers.PluginConfiguration = pluginConfiguration.from(
            "core-api",
            defaults,
        );

        app.bind(Container.Identifiers.PluginConfiguration)
            .toConstantValue(pluginConfigurationInstance)
            .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("plugin", "@arkecosystem/core-api"));
    });

    describe("initialize", () => {
        it("should be ok", async () => {
            await expect(server.initialize("Test", serverConfig)).toResolve();
        });

        it("should response with hello world", async () => {
            await expect(server.initialize("Test", serverConfig)).toResolve();

            const injectOptions = {
                method: "GET",
                url: "/",
            };

            const response = await server.inject(injectOptions);
            const payload = JSON.parse(response.payload || {});

            expect(payload.data).toBe("Hello World!");
        });
    });

    describe("uri", () => {
        it("should return server uri", async () => {
            await expect(server.initialize("Test", serverConfig)).toResolve();

            expect(server.uri).toEqual("http://0.0.0.0:4003");
        });
    });

    describe("route", () => {
        it("should add custom route", async () => {
            await expect(server.initialize("Test", serverConfig)).toResolve();

            const testRoute = {
                method: "GET",
                path: "/test",
                handler: () => "ok",
            };

            expect(server.route(testRoute)).toResolve();

            const injectOptions = {
                method: "GET",
                url: "/test",
            };

            const response = await server.inject(injectOptions);

            expect(response.payload).toBe("ok");
        });
    });

    describe("getRoute", () => {
        it("should get custom route", async () => {
            await expect(server.initialize("Test", serverConfig)).toResolve();

            const testRoute = {
                method: "GET",
                path: "/test",
                handler: () => "ok",
            };

            await expect(server.route(testRoute)).toResolve();

            const returnedRoute = server.getRoute("GET", "/test");

            expect(returnedRoute.method).toEqual("get");
            expect(returnedRoute.path).toEqual("/test");
        });

        it("should get custom route and override handler", async () => {
            await expect(server.initialize("Test", serverConfig)).toResolve();

            const testRoute = {
                method: "GET",
                path: "/test",
                handler: () => "ok",
            };

            await expect(server.route(testRoute)).toResolve();

            const injectOptions = {
                method: "GET",
                url: "/test",
            };

            const response = await server.inject(injectOptions);

            expect(response.payload).toBe("ok");

            const returnedRoute = server.getRoute("GET", "/test");
            returnedRoute.settings.handler = () => "override";

            const anotherResponse = await server.inject(injectOptions);

            expect(anotherResponse.payload).toBe("override");
        });

        it("should get custom route and extend response", async () => {
            await expect(server.initialize("Test", serverConfig)).toResolve();

            const testRoute = {
                method: "GET",
                path: "/test",
                handler: () => {
                    return {
                        data1: "data1",
                    };
                },
            };

            await expect(server.route(testRoute)).toResolve();

            const injectOptions = {
                method: "GET",
                url: "/test",
            };

            const response = await server.inject(injectOptions);

            expect(response.payload).toBe(
                JSON.stringify({
                    data1: "data1",
                }),
            );

            const returnedRoute = server.getRoute("GET", "/test");

            const originalHandler = returnedRoute.settings.handler;
            returnedRoute.settings.handler = () => {
                const item = originalHandler();
                item.data2 = "data2";

                return item;
            };

            const anotherResponse = await server.inject(injectOptions);

            expect(anotherResponse.payload).toBe(
                JSON.stringify({
                    data1: "data1",
                    data2: "data2",
                }),
            );
        });
    });

    describe("register", () => {
        it("should be ok", async () => {
            await expect(server.initialize("Test", serverConfig)).toResolve();

            await expect(server.register(preparePlugins(defaults.plugins))).toResolve();
        });
    });
});
