import "@packages/core-test-framework/src/matchers";

import { setUp, tearDown } from "../__support__/setup";
import { utils } from "../utils";

const voteId = "2e912822d2f9006f5cea51e1f517129b8c90f532d987c9a369fb8dd52ce869bc";

beforeAll(setUp);
afterAll(tearDown);

describe("API 2.0 - Votes", () => {
    describe("GET /votes", () => {
        it("should GET all the votes", async () => {
            const response = await utils.request("GET", "votes");
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            utils.expectPaginator(response);

            expect(response.data.data[0]).toBeObject();
            expect(response.data.meta.count).toBeNumber();
        });
    });

    describe("GET /votes/:id", () => {
        it("should GET a vote by the given identifier", async () => {
            const response = await utils.request("GET", `votes/${voteId}`);
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeObject();

            expect(response.data.data).toBeObject();
            expect(response.data.data.id).toBe(voteId);
        });

        it("should fail to GET a vote by the given identifier if it doesn't exist", async () => {
            utils.expectError(
                await utils.request("GET", "votes/9816f8d8c257ea0c951deba911266394b0f2614df023f8b4ffd9da43d36efd9d"),
                404,
            );
        });
    });
});
