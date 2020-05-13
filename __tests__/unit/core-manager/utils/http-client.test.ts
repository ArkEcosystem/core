import "jest-extended";

import { HttpClient } from "@packages/core-manager/src/utils";
import nock from "nock";

describe("HttpClient", () => {
    describe("get", () => {
        it("should be ok", async () => {
            nock.cleanAll();

            nock(/.*/).get("/").reply(200, {
                result: {},
            });

            const httpClient = new HttpClient({ ip: "0.0.0.0", port: 4003, protocol: "http" });

            const promise = httpClient.get("/");

            const result = await promise;

            expect(result).toEqual({ result: {} });
        });
    });
});
