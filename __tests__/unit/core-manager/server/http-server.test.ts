import "jest-extended";

import { Container, Providers } from "@packages/core-kernel";
import { ActionReader } from "@packages/core-manager/src/action-reader";
import { Actions } from "@packages/core-manager/src/contracts";
import { defaults } from "@packages/core-manager/src/defaults";
import { Identifiers } from "@packages/core-manager/src/ioc";
import { HttpServer } from "@packages/core-manager/src/server/http-server";
import { PluginFactory } from "@packages/core-manager/src/server/plugins/plugin-factory";
import { Argon2id, SimpleTokenValidator } from "@packages/core-manager/src/server/validators";
import { Sandbox } from "@packages/core-test-framework";
import { cloneDeep } from "lodash";

import { Assets } from "../__fixtures__";

let sandbox: Sandbox;
let server: HttpServer;

const logger = {
    info: jest.fn(),
    notice: jest.fn(),
    error: jest.fn(),
};

let configuration;

const registerRoute = async (server: any) => {
    await server.server.route({
        method: "GET",
        path: "/",
        handler: () => {
            return {};
        },
    });
};

beforeEach(() => {
    const dummyMethod = { ...Assets.dummyMethod };

    const actionReader: Partial<ActionReader> = {
        discoverActions(): Actions.Method[] {
            return [dummyMethod];
        },
    };

    configuration = cloneDeep(defaults);

    configuration.plugins.basicAuthentication.enabled = false;
    configuration.plugins.tokenAuthentication.enabled = false;

    sandbox = new Sandbox();

    sandbox.app.bind(Identifiers.HTTP).to(HttpServer).inSingletonScope();
    sandbox.app.bind(Identifiers.ActionReader).toConstantValue(actionReader);
    sandbox.app.bind(Identifiers.PluginFactory).to(PluginFactory).inSingletonScope();
    sandbox.app.bind(Identifiers.BasicCredentialsValidator).to(Argon2id).inSingletonScope();
    sandbox.app.bind(Identifiers.TokenValidator).to(SimpleTokenValidator).inSingletonScope();

    sandbox.app.bind(Container.Identifiers.LogService).toConstantValue(logger);

    sandbox.app.bind(Container.Identifiers.PluginConfiguration).to(Providers.PluginConfiguration).inSingletonScope();
    sandbox.app
        .get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration)
        .from("@arkecosystem/core-monitor", configuration);

    sandbox.app.terminate = jest.fn();

    server = sandbox.app.get<HttpServer>(Identifiers.HTTP);
});

afterEach(async () => {
    await server.dispose();
    jest.clearAllMocks();
    jest.restoreAllMocks();
});

describe("Server", () => {
    describe("Whitelist", () => {
        it("should return HTTP error if whitelisted", async () => {
            configuration.plugins.whitelist = [];

            await server.initialize("serverName", {});
            registerRoute(server);
            await server.boot();

            const injectOptions = {
                method: "GET",
                url: "/",
            };

            const response = await server.inject(injectOptions);
            const parsedResponse: Record<string, any> = { body: response.result, statusCode: response.statusCode };

            expect(parsedResponse).toEqual({
                body: {
                    error: "Unauthorized",
                    message: "Unauthorized",
                    statusCode: 401,
                },
                statusCode: 401,
            });
        });
    });

    describe("Basic Authentication", () => {
        let injectOptions;

        beforeEach(() => {
            configuration.plugins.tokenAuthentication.enabled = false;
            configuration.plugins.basicAuthentication.enabled = true;
            configuration.plugins.basicAuthentication.users = [
                {
                    username: "username",
                    password:
                        "$argon2id$v=19$m=4096,t=3,p=1$NiGA5Cy5vFWTxhBaZMG/3Q$TwEFlzTuIB0fDy+qozEas+GzEiBcLRkm5F+/ClVRCDY",
                },
            ];

            injectOptions = {
                method: "GET",
                url: "/",
                headers: {},
            };
        });

        it("should be ok with valid username and password", async () => {
            await server.initialize("serverName", {});
            await registerRoute(server);
            await server.boot();

            // Data in header: { username: "username", password: "password" }
            injectOptions.headers.Authorization = "Basic dXNlcm5hbWU6cGFzc3dvcmQ=";

            const response = await server.inject(injectOptions);
            const parsedResponse: Record<string, any> = { body: response.result, statusCode: response.statusCode };

            expect(parsedResponse).toEqual({ body: {}, statusCode: 200 });
        });

        it("should return HTTP error if no username and password in header", async () => {
            await server.initialize("serverName", {});
            await registerRoute(server);
            await server.boot();

            const response = await server.inject(injectOptions);
            const parsedResponse: Record<string, any> = { body: response.result, statusCode: response.statusCode };

            expect(parsedResponse).toEqual({
                body: {
                    error: "Unauthorized",
                    message: "Missing authentication",
                    statusCode: 401,
                },
                statusCode: 401,
            });
        });

        it("should return HTTP error if password is invalid", async () => {
            await server.initialize("serverName", {});
            await registerRoute(server);
            await server.boot();

            // Data in header: { username: "username", password: "invalid" }
            injectOptions.headers.Authorization = "Basic dXNlcm5hbWU6aW52YWxpZA==";

            const response = await server.inject(injectOptions);
            const parsedResponse: Record<string, any> = { body: response.result, statusCode: response.statusCode };

            expect(parsedResponse).toEqual({
                body: {
                    attributes: {
                        error: "Bad username or password",
                    },
                    error: "Unauthorized",
                    message: "Bad username or password",
                    statusCode: 401,
                },
                statusCode: 401,
            });
        });

        it("should return HTTP error user not found", async () => {
            configuration.plugins.basicAuthentication.users = [];

            await server.initialize("serverName", {});
            await registerRoute(server);
            await server.boot();

            // Data in header: { username: "username", password: "password" }
            injectOptions.headers.Authorization = "Basic dXNlcm5hbWU6cGFzc3dvcmQ=";

            const response = await server.inject(injectOptions);
            const parsedResponse: Record<string, any> = { body: response.result, statusCode: response.statusCode };

            expect(parsedResponse).toEqual({
                body: {
                    attributes: {
                        error: "Bad username or password",
                    },
                    error: "Unauthorized",
                    message: "Bad username or password",
                    statusCode: 401,
                },
                statusCode: 401,
            });
        });
    });

    describe("Token Authentication", () => {
        let injectOptions;

        beforeEach(() => {
            configuration.plugins.tokenAuthentication.enabled = true;
            configuration.plugins.tokenAuthentication.token = "secret_token";

            injectOptions = {
                method: "GET",
                url: "/",
                headers: {},
            };
        });

        it("should be ok with valid token in headers", async () => {
            await server.initialize("serverName", {});
            await registerRoute(server);
            await server.boot();

            injectOptions.headers.Authorization = "Bearer secret_token";

            const response = await server.inject(injectOptions);
            const parsedResponse: Record<string, any> = { body: response.result, statusCode: response.statusCode };

            expect(parsedResponse).toEqual({ body: {}, statusCode: 200 });
        });

        it("should be ok with valid token in params", async () => {
            await server.initialize("serverName", {});
            await registerRoute(server);
            await server.boot();

            injectOptions.url += "?token=secret_token";

            const response = await server.inject(injectOptions);
            const parsedResponse: Record<string, any> = { body: response.result, statusCode: response.statusCode };

            expect(parsedResponse).toEqual({ body: {}, statusCode: 200 });
        });

        it("should return HTTP error if token in headers is not valid", async () => {
            await server.initialize("serverName", {});
            await registerRoute(server);
            await server.boot();

            injectOptions.headers.Authorization = "Bearer invalid_token";

            const response = await server.inject(injectOptions);
            const parsedResponse: Record<string, any> = { body: response.result, statusCode: response.statusCode };

            expect(parsedResponse).toEqual({
                body: {
                    attributes: {
                        error: "Bad token",
                    },
                    error: "Unauthorized",
                    message: "Bad token",
                    statusCode: 401,
                },
                statusCode: 401,
            });
        });

        it("should return HTTP error if token in params is not valid", async () => {
            await server.initialize("serverName", {});
            await registerRoute(server);
            await server.boot();

            injectOptions.url += "?token=invalid_token";

            const response = await server.inject(injectOptions);
            const parsedResponse: Record<string, any> = { body: response.result, statusCode: response.statusCode };

            expect(parsedResponse).toEqual({
                body: {
                    attributes: {
                        error: "Bad token",
                    },
                    error: "Unauthorized",
                    message: "Bad token",
                    statusCode: 401,
                },
                statusCode: 401,
            });
        });

        it("should return HTTP error if token configuration is missing", async () => {
            delete configuration.plugins.tokenAuthentication.token;

            await server.initialize("serverName", {});
            await registerRoute(server);
            await server.boot();

            const response = await server.inject(injectOptions);
            const parsedResponse: Record<string, any> = { body: response.result, statusCode: response.statusCode };

            expect(parsedResponse).toEqual({
                body: {
                    error: "Unauthorized",
                    message: "Missing authentication",
                    statusCode: 401,
                },
                statusCode: 401,
            });
        });
    });
});
