import "jest-extended";

import { Container, Providers } from "@packages/core-kernel";
import { ActionReader } from "@packages/core-manager/src/action-reader";
import { Actions } from "@packages/core-manager/src/contracts";
import { defaults } from "@packages/core-manager/src/defaults";
import { Identifiers } from "@packages/core-manager/src/ioc";
import { PluginFactory } from "@packages/core-manager/src/server/plugins/plugin-factory";
import { Server } from "@packages/core-manager/src/server/server";
import { Argon2id, SimpleTokenValidator } from "@packages/core-manager/src/server/validators";
import { Sandbox } from "@packages/core-test-framework";
import { cloneDeep } from "lodash";
import { Validation } from "@packages/crypto";

import { Assets } from "../__fixtures__";

let sandbox: Sandbox;
let server: Server;
let spyOnMethod: jest.SpyInstance;

const logger = {
    info: jest.fn(),
    notice: jest.fn(),
    error: jest.fn(),
};

let configuration;

beforeEach(() => {
    const dummyMethod = { ...Assets.dummyMethod };
    // @ts-ignore
    spyOnMethod = jest.spyOn(dummyMethod, "method");

    const actionReader: Partial<ActionReader> = {
        discoverActions(): Actions.Method[] {
            return [dummyMethod];
        },
    };

    configuration = cloneDeep(defaults);

    configuration.plugins.basicAuthentication.enabled = false;
    configuration.plugins.tokenAuthentication.enabled = false;

    sandbox = new Sandbox();

    sandbox.app.bind(Identifiers.HTTP_JSON_RPC).to(Server).inSingletonScope();
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

    server = sandbox.app.get<Server>(Identifiers.HTTP_JSON_RPC);
});

afterEach(async () => {
    await server.dispose();
    jest.clearAllMocks();
    jest.restoreAllMocks();
});

describe("Server", () => {
    describe("RPC test with dummy class", () => {
        it("should be ok", async () => {
            await server.initialize("serverName", {});
            await server.boot();

            const injectOptions = {
                method: "POST",
                url: "/",
                payload: {
                    jsonrpc: "2.0",
                    id: "1",
                    method: "dummy",
                    params: { id: 123 },
                },
                headers: {
                    "content-type": "application/vnd.api+json",
                },
            };

            const response = await server.inject(injectOptions);
            const parsedResponse: Record<string, any> = { body: response.result, statusCode: response.statusCode };

            expect(parsedResponse).toEqual({ body: { id: "1", jsonrpc: "2.0", result: {} }, statusCode: 200 });
        });

        it("should return RCP error if called with invalid action params", async () => {
            await server.initialize("serverName", {});
            await server.boot();

            const injectOptions = {
                method: "POST",
                url: "/",
                payload: {
                    jsonrpc: "2.0",
                    id: "1",
                    method: "dummy",
                    params: {}, // Missing id
                },
                headers: {
                    "content-type": "application/vnd.api+json",
                },
            };

            const response = await server.inject(injectOptions);
            const parsedResponse: Record<string, any> = { body: response.result, statusCode: response.statusCode };

            expect(parsedResponse.statusCode).toBe(200);
            expect(parsedResponse.body.error.code).toBe(-32602);
        });

        it("should return RCP error if error inside Action method", async () => {
            await server.initialize("serverName", {});
            await server.boot();

            const injectOptions = {
                method: "POST",
                url: "/",
                payload: {
                    jsonrpc: "2.0",
                    id: "1",
                    method: "dummy",
                    params: { id: 123 },
                },
                headers: {
                    "content-type": "application/vnd.api+json",
                },
            };

            spyOnMethod.mockImplementation(async () => {
                throw new Error();
            });

            const response = await server.inject(injectOptions);
            const parsedResponse: Record<string, any> = { body: response.result, statusCode: response.statusCode };

            expect(parsedResponse.statusCode).toBe(200);
            expect(parsedResponse.body.error.code).toBe(-32603);
            expect(spyOnMethod).toHaveBeenCalled();
        });

        it("should return RCP error if RPC schema is invalid", async () => {
            await server.initialize("serverName", {});
            await server.boot();

            const injectOptions = {
                method: "POST",
                url: "/",
                payload: {
                    jsonrpc: "2.0",
                    // id: "1",
                    method: "dummy",
                    params: { id: 123 },
                },
                headers: {
                    "content-type": "application/vnd.api+json",
                },
            };

            const response = await server.inject(injectOptions);
            const parsedResponse: Record<string, any> = { body: response.result, statusCode: response.statusCode };

            expect(parsedResponse.statusCode).toBe(200);
            expect(parsedResponse.body.error.code).toBe(-32600);
        });

        it("should return RCP error if error in Validator", async () => {
            await server.initialize("serverName", {});
            await server.boot();

            const injectOptions = {
                method: "POST",
                url: "/",
                payload: {
                    jsonrpc: "2.0",
                    id: "1",
                    method: "dummy",
                    params: { id: 123 },
                },
                headers: {
                    "content-type": "application/vnd.api+json",
                },
            };

            jest.spyOn(Validation.validator, "validate").mockImplementation(() => {
                throw new Error();
            });

            const response = await server.inject(injectOptions);
            const parsedResponse: Record<string, any> = { body: response.result, statusCode: response.statusCode };

            expect(parsedResponse.statusCode).toBe(200);
            expect(parsedResponse.body.error.code).toBe(-32600);
        });
    });

    describe("Whitelist", () => {
        it("should return RCP error if whitelisted", async () => {
            configuration.plugins.whitelist = [];

            await server.initialize("serverName", {});
            await server.boot();

            const injectOptions = {
                method: "POST",
                url: "/",
                payload: {
                    jsonrpc: "2.0",
                    id: "1",
                    method: "dummy",
                    params: { id: 123 },
                },
                headers: {
                    "content-type": "application/vnd.api+json",
                },
            };

            const response = await server.inject(injectOptions);
            const parsedResponse: Record<string, any> = { body: response.result, statusCode: response.statusCode };

            expect(parsedResponse).toEqual({
                body: {
                    jsonrpc: "2.0",
                    error: { code: -32001, message: "These credentials do not match our records" },
                    id: null,
                },
                statusCode: 200,
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
                method: "POST",
                url: "/",
                payload: {
                    jsonrpc: "2.0",
                    id: "1",
                    method: "dummy",
                    params: { id: 123 },
                },
                headers: {
                    "content-type": "application/vnd.api+json",
                },
            };
        });

        it("should be ok with valid username and password", async () => {
            await server.initialize("serverName", {});
            await server.boot();

            // Data in header: { username: "username", password: "password" }
            injectOptions.headers.Authorization = "Basic dXNlcm5hbWU6cGFzc3dvcmQ=";

            const response = await server.inject(injectOptions);
            const parsedResponse: Record<string, any> = { body: response.result, statusCode: response.statusCode };

            expect(parsedResponse).toEqual({ body: { id: "1", jsonrpc: "2.0", result: {} }, statusCode: 200 });
        });

        it("should return RCP error if no username and password in header", async () => {
            await server.initialize("serverName", {});
            await server.boot();

            const response = await server.inject(injectOptions);
            const parsedResponse: Record<string, any> = { body: response.result, statusCode: response.statusCode };

            expect(parsedResponse).toEqual({
                body: {
                    jsonrpc: "2.0",
                    error: { code: -32001, message: "These credentials do not match our records" },
                    id: null,
                },
                statusCode: 200,
            });
        });

        it("should return RCP error if password is invalid", async () => {
            await server.initialize("serverName", {});
            await server.boot();

            // Data in header: { username: "username", password: "invalid" }
            injectOptions.headers.Authorization = "Basic dXNlcm5hbWU6aW52YWxpZA==";

            const response = await server.inject(injectOptions);
            const parsedResponse: Record<string, any> = { body: response.result, statusCode: response.statusCode };

            expect(parsedResponse).toEqual({
                body: {
                    jsonrpc: "2.0",
                    error: { code: -32001, message: "These credentials do not match our records" },
                    id: null,
                },
                statusCode: 200,
            });
        });

        it("should return RCP error user not found", async () => {
            configuration.plugins.basicAuthentication.users = [];

            await server.initialize("serverName", {});
            await server.boot();

            // Data in header: { username: "username", password: "password" }
            injectOptions.headers.Authorization = "Basic dXNlcm5hbWU6cGFzc3dvcmQ=";

            const response = await server.inject(injectOptions);
            const parsedResponse: Record<string, any> = { body: response.result, statusCode: response.statusCode };

            expect(parsedResponse).toEqual({
                body: {
                    jsonrpc: "2.0",
                    error: { code: -32001, message: "These credentials do not match our records" },
                    id: null,
                },
                statusCode: 200,
            });
        });
    });

    describe("Token Authentication", () => {
        let injectOptions;

        beforeEach(() => {
            configuration.plugins.tokenAuthentication.enabled = true;
            configuration.plugins.tokenAuthentication.token = "secret_token";

            injectOptions = {
                method: "POST",
                url: "/",
                payload: {
                    jsonrpc: "2.0",
                    id: "1",
                    method: "dummy",
                    params: { id: 123 },
                },
                headers: {
                    "content-type": "application/vnd.api+json",
                },
            };
        });

        it("should be ok with valid token in headers", async () => {
            await server.initialize("serverName", {});
            await server.boot();

            injectOptions.headers.Authorization = "Bearer secret_token";

            const response = await server.inject(injectOptions);
            const parsedResponse: Record<string, any> = { body: response.result, statusCode: response.statusCode };

            expect(parsedResponse).toEqual({ body: { id: "1", jsonrpc: "2.0", result: {} }, statusCode: 200 });
        });

        it("should be ok with valid token in params", async () => {
            await server.initialize("serverName", {});
            await server.boot();

            injectOptions.url += "?token=secret_token";

            const response = await server.inject(injectOptions);
            const parsedResponse: Record<string, any> = { body: response.result, statusCode: response.statusCode };

            expect(parsedResponse).toEqual({ body: { id: "1", jsonrpc: "2.0", result: {} }, statusCode: 200 });
        });

        it("should return RCP error if token in headers is not valid", async () => {
            await server.initialize("serverName", {});
            await server.boot();

            injectOptions.headers.Authorization = "Bearer invalid_token";

            const response = await server.inject(injectOptions);
            const parsedResponse: Record<string, any> = { body: response.result, statusCode: response.statusCode };

            expect(parsedResponse).toEqual({
                body: {
                    jsonrpc: "2.0",
                    error: { code: -32001, message: "These credentials do not match our records" },
                    id: null,
                },
                statusCode: 200,
            });
        });

        it("should return RCP error if token in params is not valid", async () => {
            await server.initialize("serverName", {});
            await server.boot();

            injectOptions.url += "?token=invalid_token";

            const response = await server.inject(injectOptions);
            const parsedResponse: Record<string, any> = { body: response.result, statusCode: response.statusCode };

            expect(parsedResponse).toEqual({
                body: {
                    jsonrpc: "2.0",
                    error: { code: -32001, message: "These credentials do not match our records" },
                    id: null,
                },
                statusCode: 200,
            });
        });

        it("should return RCP error if token configuration is missing", async () => {
            delete configuration.plugins.tokenAuthentication.token;

            await server.initialize("serverName", {});
            await server.boot();

            injectOptions.headers.Authorization = "Bearer invalid_token";

            const response = await server.inject(injectOptions);
            const parsedResponse: Record<string, any> = { body: response.result, statusCode: response.statusCode };

            expect(parsedResponse).toEqual({
                body: {
                    jsonrpc: "2.0",
                    error: { code: -32001, message: "These credentials do not match our records" },
                    id: null,
                },
                statusCode: 200,
            });
        });

        it("should return RCP error if no Authentication in headers", async () => {
            delete configuration.plugins.tokenAuthentication.token;

            await server.initialize("serverName", {});
            await server.boot();

            const response = await server.inject(injectOptions);
            const parsedResponse: Record<string, any> = { body: response.result, statusCode: response.statusCode };

            expect(parsedResponse).toEqual({
                body: {
                    jsonrpc: "2.0",
                    error: { code: -32001, message: "These credentials do not match our records" },
                    id: null,
                },
                statusCode: 200,
            });
        });
    });
});
