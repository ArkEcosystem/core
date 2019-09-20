import "../../../utils";

import { setUp, tearDown } from "../__support__/setup";
import { utils } from "../utils";

beforeAll(async () => await setUp());
afterAll(async () => await tearDown());

describe("API 2.0 - Blockchain", () => {
    describe("GET /blockchain", () => {
        it("should GET the blockchain info", async () => {
            const response = await utils.request("GET", "blockchain");
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeObject();

            expect(response.data.data.block.height).toBeNumber();
            expect(response.data.data.block.id).toBeString();
            expect(response.data.data.supply).toBeString();
        });
    });
});
