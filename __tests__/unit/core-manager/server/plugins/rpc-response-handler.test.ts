import "jest-extended";

import { Server as HapiServer } from "@hapi/hapi";
import * as Boom from "@hapi/boom";
import * as rpc from "@hapist/json-rpc";

import { Container } from "@packages/core-kernel";
import { Validation } from "@packages/crypto";
import { Sandbox } from "@packages/core-test-framework";
import { Identifiers } from "@packages/core-manager/src/ioc";
import { Server } from "@packages/core-manager/src/server/server";
import { ActionReader } from "@packages/core-manager/src/action-reader";
import { Actions, Plugins } from "@packages/core-manager/src/contracts";
import { rpcResponseHandler } from "@packages/core-manager/src/server/plugins/rpc-response-handler";
import { Assets } from "../../__fixtures__";

let sandbox: Sandbox;
let server: Server;

let mockOnRequest = jest.fn();

// @ts-ignore
let dummyPlugin = {
    name: "dummy",
    version: "0.0.1",
    register: (server: HapiServer) => {
        server.ext({
            type: "onRequest",
            method: mockOnRequest,
        });
    },
};

let mockPluginFactory: Plugins.PluginFactory = {
    preparePlugins() {
        return [
            {
                plugin: rpcResponseHandler,
            },
            {
                plugin: rpc,
                options: {
                    methods: [Assets.dummyMethod],
                    processor: {
                        schema: {
                            properties: {
                                id: {
                                    type: ["number", "string"],
                                },
                                jsonrpc: {
                                    pattern: "2.0",
                                    type: "string",
                                },
                                method: {
                                    type: "string",
                                },
                                params: {
                                    type: "object",
                                },
                            },
                            required: ["jsonrpc", "method", "id"],
                            type: "object",
                        },
                        validate(data: object, schema: object) {
                            try {
                                const { error } = Validation.validator.validate(schema, data);
                                return { value: data, error: error ? error : null };
                            } catch (error) {
                                return { value: null, error: error.stack };
                            }
                        },
                    },
                },
            },
            {
                plugin: dummyPlugin,
            },
        ];
    },
};

let logger = {
    info: jest.fn(),
    notice: jest.fn(),
    error: jest.fn(),
};

beforeEach(() => {
    let actionReader: Partial<ActionReader> = {
        discoverActions(): Actions.Method[] {
            return [Assets.dummyMethod];
        },
    };

    sandbox = new Sandbox();

    sandbox.app.bind(Identifiers.HTTP_JSON_RPC).to(Server).inSingletonScope();
    sandbox.app.bind(Identifiers.ActionReader).toConstantValue(actionReader);
    sandbox.app.bind(Identifiers.PluginFactory).toConstantValue(mockPluginFactory);

    sandbox.app.bind(Container.Identifiers.LogService).toConstantValue(logger);

    server = sandbox.app.get<Server>(Identifiers.HTTP_JSON_RPC);
});

afterEach(async () => {
    await server.dispose();
    jest.clearAllMocks();
});

describe("RPC Response Handler", () => {
    let injectOptions;

    beforeEach(() => {
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

    it("should return result", async () => {
        await server.initialize("serverName", {});
        await server.boot();

        mockOnRequest.mockImplementation((request, h) => {
            return h.continue;
        });

        const response = await server.inject(injectOptions);
        const parsedResponse: Record<string, any> = { body: response.result, statusCode: response.statusCode };

        expect(parsedResponse).toEqual({ body: { id: "1", jsonrpc: "2.0", result: {} }, statusCode: 200 });
    });

    it("should return status -32001 if 401 response code", async () => {
        await server.initialize("serverName", {});
        await server.boot();

        mockOnRequest.mockImplementation((request, h) => {
            return Boom.unauthorized();
        });

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

    it("should return status -32003 if 403 response code", async () => {
        await server.initialize("serverName", {});
        await server.boot();

        mockOnRequest.mockImplementation((request, h) => {
            return Boom.forbidden();
        });

        const response = await server.inject(injectOptions);
        const parsedResponse: Record<string, any> = { body: response.result, statusCode: response.statusCode };

        expect(parsedResponse).toEqual({
            body: {
                jsonrpc: "2.0",
                error: { code: -32003, message: "Forbidden" },
                id: null,
            },
            statusCode: 200,
        });
    });

    it("should return status -32603 if unhandled response code", async () => {
        await server.initialize("serverName", {});
        await server.boot();

        mockOnRequest.mockImplementation((request, h) => {
            return Boom.notImplemented();
        });

        const response = await server.inject(injectOptions);
        const parsedResponse: Record<string, any> = { body: response.result, statusCode: response.statusCode };

        expect(parsedResponse).toEqual({
            body: {
                jsonrpc: "2.0",
                error: { code: -32603, message: "Internal server error" },
                id: null,
            },
            statusCode: 200,
        });
    });
});
