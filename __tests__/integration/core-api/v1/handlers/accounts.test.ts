import "../../../../utils";
import { setUp, tearDown } from "../../__support__/setup";
import { utils } from "../utils";

const address = "AG8kwwk4TsYfA2HdwaWBVAJQBj6VhdcpMo";

beforeAll(async () => {
    await setUp();
});

afterAll(async () => {
    await tearDown();
});

describe("API 1.0 - Wallets", () => {
    describe("GET api/accounts/getAllAccounts", () => {
        it("should return all the wallets", async () => {
            const response = await utils.request("GET", "accounts/getAllAccounts");
            expect(response).toBeSuccessfulResponse();

            expect(response.data.accounts).toBeArray();
        });
    });

    describe("GET api/accounts/?address", () => {
        it("should return account information", async () => {
            const response = await utils.request("GET", "accounts", { address });
            expect(response).toBeSuccessfulResponse();

            utils.expectWallet(response.data.account);
        });

        it("should not return an empty wallet", async () => {
            // create a cold wallet in memory with the given senderId
            const createCold = await utils.request("GET", "transactions", {
                senderId: "AbhUUMJBw1dZJiZMxKBhHsdXMMafcMaPNG",
            });
            expect(createCold).toBeSuccessfulResponse();
            expect(createCold.data.transactions).toBeEmpty();

            // attempt to retrieve the cold wallet
            const response = await utils.request("GET", "accounts", { address: "AbhUUMJBw1dZJiZMxKBhHsdXMMafcMaPNG" });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.error).toBe("Account not found");
        });
    });

    describe("GET api/accounts/getBalance?address", () => {
        it("should return balance", async () => {
            const response = await utils.request("GET", "accounts/getBalance", {
                address,
            });
            expect(response).toBeSuccessfulResponse();

            expect(response.data.balance).toBeString();
            expect(response.data.unconfirmedBalance).toBeString();
        });
    });

    describe("GET /accounts/getPublicKey?address", () => {
        it("should return public key for address", async () => {
            const response = await utils.request("GET", "accounts/getPublicKey", {
                address,
            });
            expect(response).toBeSuccessfulResponse();

            expect(response.data.publicKey).toBeString();
        });
    });

    describe("GET api/accounts/delegates/fee", () => {
        it("should return delegate fee of an account", async () => {
            const response = await utils.request("GET", "accounts/delegates/fee");
            expect(response).toBeSuccessfulResponse();

            expect(response.data.fee).toBeNumber();
        });
    });

    describe("GET /accounts/delegates?address", () => {
        it("should return delegate info the address has voted for", async () => {
            const response = await utils.request("GET", "accounts/delegates", {
                address,
            });
            expect(response).toBeSuccessfulResponse();

            expect(response.data.delegates).toBeArray();
            expect(response.data.delegates[0].producedblocks).toBeNumber();
        });
    });

    describe("GET api/accounts/top", () => {
        it("should return the top wallets", async () => {
            const response = await utils.request("GET", "accounts/top");
            expect(response).toBeSuccessfulResponse();

            expect(response.data.accounts).toBeArray();
        });
    });

    describe("GET api/accounts/count", () => {
        it("should return the total number of wallets", async () => {
            const response = await utils.request("GET", "accounts/count");
            expect(response).toBeSuccessfulResponse();

            expect(response.data.count).toBeNumber();
        });
    });
});
