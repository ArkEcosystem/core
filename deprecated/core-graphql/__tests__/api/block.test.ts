import "@arkecosystem/core-test-utils";
import genesisBlock from "../../../core-test-utils/src/config/testnet/genesisBlock.json";

import { setUp, tearDown } from "../__support__/setup";
import { utils } from "../__support__/utils";

beforeAll(async () => {
    await setUp();
});

afterAll(() => {
    tearDown();
});

describe("GraphQL API { block }", () => {
    describe("GraphQL queries for Block", () => {
        it("should get a block by its id", async () => {
            const query = `{ block(id:"${genesisBlock.id}") { id } }`;
            const response = await utils.request(query);

            expect(response).toBeSuccessfulResponse();

            const data = response.data.data;
            expect(data).toBeObject();
            expect(data.block).toBeObject();
            expect(data.block.id).toBe(genesisBlock.id);
        });
    });
});
