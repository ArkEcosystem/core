import "../../../utils";
import { setUp, tearDown } from "../__support__/setup";
import { utils } from "../utils";

const voteId = "ea294b610e51efb3ceb4229f27bf773e87f41d21b6bb1f3bf68629ffd652c2d3";

beforeAll(async () => await setUp());
afterAll(async () => await tearDown());

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
