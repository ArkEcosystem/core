import "@arkecosystem/core-test-utils";
import genesisBlock from "../../../../packages/core-test-utils/src/config/testnet/genesisBlock.json";

import { setUp, tearDown } from "../__support__/setup";
import { utils } from "../__support__/utils";

beforeAll(async () => {
    await setUp();
});

afterAll(() => {
    tearDown();
});

describe("GraphQL API { wallet }", () => {
    describe("GraphQL queries for Wallet", () => {
        it("should get a wallet by address", async () => {
            const query = `{ wallet(address:"${genesisBlock.transactions[0].senderId}") { address } }`;
            const response = await utils.request(query);

            expect(response).toBeSuccessfulResponse();

            const data = response.data.data;
            expect(data).toBeObject();
            expect(data.wallet).toBeObject();
            expect(data.wallet.address).toBe(genesisBlock.transactions[0].senderId);
        });
    });
});
