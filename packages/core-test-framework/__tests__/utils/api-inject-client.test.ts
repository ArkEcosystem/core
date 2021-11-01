import "jest-extended";

import { Identifiers } from "@packages/core-api";
import { Sandbox } from "@packages/core-test-framework";
import { ApiInjectClient } from "@packages/core-test-framework/src/utils";

let sandbox: Sandbox;
let apiClient: ApiInjectClient;

const mockServer = {
    uri: "http://localhost:3030",
    inject: jest.fn(),
};

let rawResponse;
let response;

beforeEach(async () => {
    rawResponse = {
        method: "get",
        statusCode: 200,
        statusMessage: undefined,
        headers: { headername: "headerValue" },
        result: "response_data",
    };

    response = {
        status: 200,
        headers: { headername: "headerValue" },
        body: "response_data",
    };

    sandbox = new Sandbox();
    sandbox.app.bind(Identifiers.HTTP).toConstantValue(mockServer);
    apiClient = sandbox.app.resolve(ApiInjectClient);
});

afterEach(() => {
    jest.resetAllMocks();
});

describe("ApiHelpers", () => {
    describe("get", () => {
        let spyOnGet;

        beforeEach(() => {
            spyOnGet = jest.spyOn(mockServer, "inject").mockResolvedValue(rawResponse);
        });

        it("should return response", async () => {
            await expect(apiClient.get("test", { a: "a" })).resolves.toEqual(response);
            expect(spyOnGet).toHaveBeenCalled();
        });

        it("should return response if params are undefined", async () => {
            await expect(apiClient.get("test")).resolves.toEqual(response);
            expect(spyOnGet).toHaveBeenCalled();
        });

        it("should return response if path includes ?", async () => {
            await expect(apiClient.get("test?", { a: "a" })).resolves.toEqual(response);
            expect(spyOnGet).toHaveBeenCalled();
        });
    });

    describe("post", () => {
        let spyOnGet;

        beforeEach(() => {
            spyOnGet = jest.spyOn(mockServer, "inject").mockResolvedValue(rawResponse);
        });

        it("should return response", async () => {
            await expect(apiClient.post("test", {}, { a: "a" })).resolves.toEqual(response);
            expect(spyOnGet).toHaveBeenCalled();
        });

        it("should return response if params are undefined", async () => {
            await expect(apiClient.post("test", {})).resolves.toEqual(response);
            expect(spyOnGet).toHaveBeenCalled();
        });

        it("should return response if path includes ?", async () => {
            await expect(apiClient.post("test?", {}, { a: "a" })).resolves.toEqual(response);
            expect(spyOnGet).toHaveBeenCalled();
        });
    });
});
