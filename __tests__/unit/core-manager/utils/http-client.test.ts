import "jest-extended";

import mockAxios from 'jest-mock-axios';
import { HttpClient } from "@packages/core-manager/src/utils";

describe("HttpClient", () => {
    describe("get", () => {
        it("should be ok", async () => {
            let httpClient = new HttpClient( "http", "0.0.0.0", 4003);

            let promise = httpClient.get("/")
            mockAxios.mockResponse({ data: { result: {} } });

            let result = await promise;

            expect(result).toEqual({ result: {} });
        })
    })
})

