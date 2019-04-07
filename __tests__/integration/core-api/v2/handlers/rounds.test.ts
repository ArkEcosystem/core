import { calculateRanks, setUp, tearDown } from "../../__support__/setup";
import { utils } from "../utils";

beforeAll(async () => {
    await setUp();
    await calculateRanks();
});

afterAll(async () => {
    await tearDown();
});

describe("API 2.0 - Rounds", () => {
    describe("GET /rounds/:id/delegates", () => {
        describe.each([["API-Version", "request"], ["Accept", "requestWithAcceptHeader"]])(
            "using the %s header",
            (header, request) => {
                it("should GET the delegates of a round by the given identifier", async () => {
                    const response = await utils[request]("GET", `rounds/1/delegates`);

                    expect(response).toBeSuccessfulResponse();
                    expect(response.data.data).toBeArray();
                    expect(response.data.data).toHaveLength(51);

                    expect(response.data.data.sort((a, b) => {
                        return a.balance > b.balance || a.publicKey < b.publicKey;
                    })).toEqual(response.data.data);
                });
            },
        );
    });
});
