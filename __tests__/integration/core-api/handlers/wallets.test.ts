import "@packages/core-test-framework/src/matchers";

import { Contracts } from "@arkecosystem/core-kernel";
import { Identities } from "@arkecosystem/crypto";
import { ApiHelpers } from "@packages/core-test-framework/src";

import { setUp, tearDown } from "../__support__/setup";

const username = "genesis_1";
const publicKey = "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37";

let address;

const validIdentifiers = {
    username,
    address,
    publicKey,
};

let app: Contracts.Kernel.Application;
let api: ApiHelpers;

beforeAll(async () => {
    app = await setUp();
    api = new ApiHelpers(app);

    address = Identities.Address.fromPublicKey(publicKey);

    validIdentifiers.address = address;
});

afterAll(async () => await tearDown());

describe("API 2.0 - Wallets", () => {
    describe("GET /wallets", () => {
        it("should GET all the wallets", async () => {
            const response = await api.request("GET", `wallets`);
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(52);
        });

        it("should GET the wallets for the specified addresses", async () => {
            const address = ["APRiwbs17FdbaF8DYU9js2jChRehQc2e6P", "AReCSCQRssLGF4XyhTjxhQm6mBFAWTaDTz"];
            const response = await api.request("GET", `wallets`, { address });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(2);
            expect(response.data.data.map(w => w.address).sort()).toEqual(address.sort());
        });
    });

    describe("GET /wallets/:id/transactions", () => {
        it("should GET all the transactions for the given wallet by id", async () => {
            const response = await api.request("GET", `wallets/${address}/transactions`);
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            api.expectTransaction(response.data.data[0]);
        });
    });

    describe("GET /wallets/:id/transactions/sent", () => {
        it("should GET all the send transactions for the given wallet by id", async () => {
            const response = await api.request("GET", `wallets/${address}/transactions/sent`);
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            const transaction = response.data.data[0];
            api.expectTransaction(transaction);
            expect(transaction.sender).toBe(address);
        });

        it("should fail to GET all the sent transactions for the given wallet if it doesn't exist", async () => {
            api.expectError(await api.request("GET", "wallets/fake_address/transactions/sent"), 404);
        });
    });

    describe("GET /wallets/:id/transactions/received", () => {
        it("should GET all the received transactions for the given wallet by id", async () => {
            const response = await api.request("GET", `wallets/${address}/transactions/received`);
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            api.expectTransaction(response.data.data[0]);
        });

        it("should fail to GET all the received transactions for the given wallet if it doesn't exist", async () => {
            api.expectError(await api.request("GET", "wallets/fake_address/transactions/received"), 404);
        });
    });

    describe("GET /wallets/:id/votes", () => {
        it("should GET all the votes for the given wallet by id", async () => {
            const response = await api.request("GET", `wallets/${address}/votes`);
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data[0]).toBeObject();
        });

        it("should fail to GET all the votes for the given wallet if it doesn't exist", async () => {
            api.expectError(await api.request("GET", "wallets/fake_address/votes"), 404);
        });
    });
});
