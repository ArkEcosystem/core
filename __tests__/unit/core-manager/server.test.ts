import "jest-extended";

import { Validation } from "@packages/crypto";
import { Container } from "@packages/core-kernel";
import { Sandbox } from "@packages/core-test-framework";
import { Identifiers } from "@packages/core-manager/src/ioc";
import { Actions } from "@packages/core-manager/src/contracts";
import { Server } from "@packages/core-manager/src/server";
import { ActionReader } from "@packages/core-manager/src/action-reader";
import { Assets } from "./__fixtures__";

let sandbox: Sandbox;
let server: Server;
let spyOnMethod: jest.SpyInstance;

let logger = {
    info: jest.fn(),
    notice: jest.fn(),
    error: jest.fn(),
}

beforeEach(() => {
    let dummyAction = new Assets.DummyAction();
    spyOnMethod = jest.spyOn(dummyAction, "method")

    let actionReader: Partial<ActionReader> = {
        discoverActions(): Actions.Action[] {
            return [dummyAction];
        }
    }

    sandbox = new Sandbox();

    sandbox.app.bind(Identifiers.HTTP).to(Server).inSingletonScope();
    sandbox.app.bind(Identifiers.ActionReader).toConstantValue(actionReader);
    sandbox.app.bind(Container.Identifiers.LogService).toConstantValue(logger);

    sandbox.app.terminate = jest.fn();

    server = sandbox.app.get<Server>(Identifiers.HTTP);
});

afterEach(() => {
    jest.clearAllMocks()
})

describe("Server", () => {
    beforeEach(async () => {
        await server.initialize("serverName", {})
        await server.boot()
    })

    afterEach(async () => {
        await server.dispose();
    })

    describe("inject", () => {
        it("should be ok", async () => {
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

            expect(parsedResponse).toEqual({ body: { id: '1', jsonrpc: '2.0', result: {} }, statusCode: 200 })
        });

        it("should return RCP error if called with invalid action params", async () => {
            const injectOptions = {
                method: "POST",
                url: "/",
                payload: {
                    jsonrpc: "2.0",
                    id: "1",
                    method: "dummy",
                    params: { }, // Missing id
                },
                headers: {
                    "content-type": "application/vnd.api+json",
                },
            };

            const response = await server.inject(injectOptions);
            const parsedResponse: Record<string, any> = { body: response.result, statusCode: response.statusCode };

            expect(parsedResponse.statusCode).toBe(200)
            expect(parsedResponse.body.error.code).toBe(-32602)
        });

        it("should return RCP error if error inside Action method", async () => {
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
            })

            const response = await server.inject(injectOptions);
            const parsedResponse: Record<string, any> = { body: response.result, statusCode: response.statusCode };

            expect(parsedResponse.statusCode).toBe(200)
            expect(parsedResponse.body.error.code).toBe(-32603)
            expect(spyOnMethod).toHaveBeenCalled();
        });

        it("should return RCP error if RPC schema is invalid", async () => {
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

            expect(parsedResponse.statusCode).toBe(200)
            expect(parsedResponse.body.error.code).toBe(-32600)
        });

        it("should return RCP error if error in Validator", async () => {
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

            Validation.validator.validate = jest.fn().mockImplementation(() => {
                throw new Error();
            })

            const response = await server.inject(injectOptions);
            const parsedResponse: Record<string, any> = { body: response.result, statusCode: response.statusCode };

            expect(parsedResponse.statusCode).toBe(200)
            expect(parsedResponse.body.error.code).toBe(-32600)
        });
    })
});
