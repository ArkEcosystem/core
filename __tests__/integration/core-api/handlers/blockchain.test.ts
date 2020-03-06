import "@packages/core-test-framework/src/matchers";

import { Contracts } from "@arkecosystem/core-kernel";
import { ApiHelpers } from "@packages/core-test-framework/src";

import { setUp, tearDown } from "../__support__/setup";

let app: Contracts.Kernel.Application;
let api: ApiHelpers;

beforeAll(async () => {
    app = await setUp();
    api = new ApiHelpers(app);
});

afterAll(async () => await tearDown());

describe("API 2.0 - Blockchain", () => {
    describe("GET /blockchain", () => {
        it("should GET the blockchain info", async () => {
            const response = await api.request("GET", "blockchain");
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeObject();

            expect(response.data.data.block.height).toBeNumber();
            expect(response.data.data.block.id).toBeString();
            expect(response.data.data.supply).toBeString();
        });
    });
});
