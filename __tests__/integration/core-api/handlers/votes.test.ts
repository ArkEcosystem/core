import "@packages/core-test-framework/src/matchers";

import { Contracts } from "@arkecosystem/core-kernel";
import { ApiHelpers } from "@packages/core-test-framework/src";

import { setUp, tearDown } from "../__support__/setup";

const voteId = "2e912822d2f9006f5cea51e1f517129b8c90f532d987c9a369fb8dd52ce869bc";

let app: Contracts.Kernel.Application;
let api: ApiHelpers;

beforeAll(async () => {
    app = await setUp();
    api = new ApiHelpers(app);
});

afterAll(async () => await tearDown());

describe("API 2.0 - Votes", () => {
    describe("GET /votes", () => {
        it("should GET all the votes", async () => {
            const response = await api.request("GET", "votes");
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            api.expectPaginator(response);

            expect(response.data.data[0]).toBeObject();
            expect(response.data.meta.count).toBeNumber();
        });
    });

    describe("GET /votes/:id", () => {
        it("should GET a vote by the given identifier", async () => {
            const response = await api.request("GET", `votes/${voteId}`);
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeObject();

            expect(response.data.data).toBeObject();
            expect(response.data.data.id).toBe(voteId);
        });

        it("should fail to GET a vote by the given identifier if it doesn't exist", async () => {
            api.expectError(
                await api.request("GET", "votes/9816f8d8c257ea0c951deba911266394b0f2614df023f8b4ffd9da43d36efd9d"),
                404,
            );
        });
    });
});
