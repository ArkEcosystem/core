import "jest-extended";

import got from 'got';
import { HttpClient } from "@packages/core-manager/src/utils";

describe("HttpClient", () => {
    describe("get", () => {
        it("should be ok", async () => {
            got.get = jest.fn().mockReturnValue({
                json: jest.fn().mockResolvedValue(
                {result: {}}
                )
            });

            let httpClient = new HttpClient( "http", "0.0.0.0", 4003);

            let promise = httpClient.get("/")

            let result = await promise;

            expect(result).toEqual({ result: {} });
        })
    })
})

