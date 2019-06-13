import "../../../../utils";
import { setUp, tearDown } from "../../__support__/setup";
import { utils } from "../utils";

beforeAll(async () => {
    await setUp();
});

afterAll(async () => {
    await tearDown();
});

describe("API 1.0 - Signatures", () => {
    describe("GET /signatures/fee", () => {
        it("should return second signature value from config", async () => {
            const response = await utils.request("GET", "signatures/fee");
            expect(response).toBeSuccessfulResponse();

            expect(response.data.fee).toBeNumber();
        });
    });
});
