import "jest-extended";

import { Utils } from "@arkecosystem/core-kernel";
import { Identifiers } from "@packages/core-api";
import { Sandbox } from "@packages/core-test-framework";
import { ApiHttpClient } from "@packages/core-test-framework/src/utils";

let sandbox: Sandbox;
let apiClient: ApiHttpClient;

const mockServer = {
    uri: "http://localhost:3030",
};

let rawResponse;
let response;

beforeEach(async () => {
    rawResponse = {
        method: "get",
        statusCode: 200,
        statusMessage: undefined,
        headers: ["headerName", "headerValue"],
        data: "response_data",
    };

    response = {
        status: 200,
        headers: { headername: "headerValue" },
        body: "response_data",
    };

    sandbox = new Sandbox();
    sandbox.app.bind(Identifiers.HTTP).toConstantValue(mockServer);
    apiClient = sandbox.app.resolve(ApiHttpClient);
});

afterEach(() => {
    jest.resetAllMocks();
});

describe("ApiHelpers", () => {
    describe("get", () => {
        let spyOnGet;

        beforeEach(() => {
            spyOnGet = jest.spyOn(Utils.http, "get").mockResolvedValue(rawResponse);
        });

        it("should return response", async () => {
            await expect(apiClient.get("test", { a: "a" })).resolves.toEqual(response);
            expect(spyOnGet).toHaveBeenCalled();
        });

        it("should return response if path includes ?", async () => {
            await expect(apiClient.get("test?", { a: "a" })).resolves.toEqual(response);
            expect(spyOnGet).toHaveBeenCalled();
        });

        it("should return response without call params", async () => {
            await expect(apiClient.get("test")).resolves.toEqual(response);
            expect(spyOnGet).toHaveBeenCalled();
        });

        it("should return error response", async () => {
            spyOnGet = jest.spyOn(Utils.http, "get").mockImplementation(() => {
                const error = new Error();

                Object.defineProperty(error, "response", {
                    enumerable: false,
                    value: rawResponse,
                });

                throw error;
            });

            await expect(apiClient.get("test", { a: "a" })).resolves.toEqual(response);
            expect(spyOnGet).toHaveBeenCalled();
        });

        it("should return error if response statusCode is undefined", async () => {
            rawResponse.statusCode = undefined;

            await expect(apiClient.get("test", { a: "a" })).rejects.toThrowError("Invalid response status undefined");
            expect(spyOnGet).toHaveBeenCalled();
        });

        it("should return error if headers.length is not dividable by 2", async () => {
            rawResponse.statusCode = 200;
            rawResponse.headers = ["Test"];

            await expect(apiClient.get("test", { a: "a" })).rejects.toThrowError('Invalid response headers ["Test"]');
            expect(spyOnGet).toHaveBeenCalled();
        });
    });

    describe("post", () => {
        let spyOnGet;

        beforeEach(() => {
            spyOnGet = jest.spyOn(Utils.http, "post").mockResolvedValue(rawResponse);
        });

        it("should return response", async () => {
            await expect(apiClient.post("test", { a: "a" })).resolves.toEqual(response);
            expect(spyOnGet).toHaveBeenCalled();
        });

        it("should return error response", async () => {
            spyOnGet = jest.spyOn(Utils.http, "post").mockImplementation(() => {
                const error = new Error();

                Object.defineProperty(error, "response", {
                    enumerable: false,
                    value: rawResponse,
                });

                throw error;
            });

            await expect(apiClient.post("test", { a: "a" })).resolves.toEqual(response);
            expect(spyOnGet).toHaveBeenCalled();
        });
    });
});
