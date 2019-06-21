import "../../../utils";

import { setUp, tearDown } from "../__support__/setup";
import { utils } from "../utils";

const username = "genesis_9";
const address = "AG8kwwk4TsYfA2HdwaWBVAJQBj6VhdcpMo";
const publicKey = "0377f81a18d25d77b100cb17e829a72259f08334d064f6c887298917a04df8f647";
const balance = 245098000000000;
const address2 = "AJjv7WztjJNYHrLAeveG5NgHWp6699ZJwD";

beforeAll(async () => await setUp());
afterAll(async () => await tearDown());

describe("API 2.0 - Wallets", () => {
    describe("GET /wallets", () => {
        it("should GET all the wallets", async () => {
            const response = await utils.request("GET", "wallets");
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            utils.expectWallet(response.data.data[0]);
        });

        it("should GET all the wallets sorted by balance,asc", async () => {
            const response = await utils.request("GET", "wallets", { orderBy: "balance:asc" });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data[0].address).toBe("APnhwwyTbMiykJwYbGhYjNgtHiVJDSEhSn");
            expect(+response.data.data[0].balance).toBe(-12500000000000000);
        });

        it("should GET all the wallets sorted by balance,desc", async () => {
            const response = await utils.request("GET", "wallets", { orderBy: "balance:desc" });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data[0].address).toBe("ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo");
            expect(+response.data.data[0].balance).toBe(245100000000000);
        });
    });

    describe("GET /wallets/top", () => {
        it("should GET all the top wallets", async () => {
            const response = await utils.request("GET", "wallets/top");
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            utils.expectWallet(response.data.data[0]);
        });
    });

    describe("GET /wallets/:id", () => {
        it("should GET a wallet by the given identifier", async () => {
            const response = await utils.request("GET", `wallets/${address}`);
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeObject();

            const wallet = response.data.data;
            utils.expectWallet(wallet);
            expect(wallet.address).toBe(address);
        });

        describe("when requesting an unknown address", () => {
            it("should return ResourceNotFound error", async () => {
                try {
                    await utils.request("GET", "wallets/dummy");
                } catch (error) {
                    expect(error.response.status).toEqual(404);
                }
            });
        });
    });

    describe("GET /wallets/:id/transactions", () => {
        it("should GET all the transactions for the given wallet by id", async () => {
            const response = await utils.request("GET", `wallets/${address}/transactions`);
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            utils.expectTransaction(response.data.data[0]);
        });

        it("should fail to GET all the transactions for the given wallet if it doesn't exist", async () => {
            utils.expectError(await utils.request("GET", "wallets/fake-address/transactions"), 404);
        });
    });

    describe("GET /wallets/:id/transactions/sent", () => {
        it("should GET all the sent transactions for the given wallet by id", async () => {
            const response = await utils.request("GET", `wallets/${address}/transactions/sent`);
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            const transaction = response.data.data[0];
            utils.expectTransaction(transaction);
            expect(transaction.sender).toBe(address);
        });

        it("should fail to GET all the sent transactions for the given wallet if it doesn't exist", async () => {
            utils.expectError(await utils.request("GET", "wallets/fake-address/transactions/sent"), 404);
        });
    });

    describe("GET /wallets/:id/transactions/received", () => {
        it("should GET all the received transactions for the given wallet by id", async () => {
            const response = await utils.request("GET", `wallets/${address}/transactions/received`);
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            utils.expectTransaction(response.data.data[0]);
        });

        it("should fail to GET all the received transactions for the given wallet if it doesn't exist", async () => {
            utils.expectError(await utils.request("GET", "wallets/fake-address/transactions/received"), 404);
        });
    });

    describe("GET /wallets/:id/votes", () => {
        it("should GET all the votes for the given wallet by id", async () => {
            const response = await utils.request("GET", `wallets/${address}/votes`);
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data[0]).toBeObject();
        });

        it("should fail to GET all the votes for the given wallet if it doesn't exist", async () => {
            utils.expectError(await utils.request("GET", "wallets/fake-address/votes"), 404);
        });
    });

    describe("POST /wallets/search", () => {
        it("should POST a search for wallets with the exact specified address", async () => {
            const response = await utils.request("POST", "wallets/search", {
                address,
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const wallet = response.data.data[0];
            utils.expectWallet(wallet);
            expect(wallet.address).toBe(address);
        });

        it("should POST a search for wallets with the any of the specified addresses", async () => {
            const response = await utils.request("POST", "wallets/search", {
                addresses: [address, address2],
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(2);

            for (const wallet of response.data.data) {
                utils.expectWallet(wallet);
            }

            const addresses = response.data.data.map(wallet => wallet.address).sort();
            expect(addresses).toEqual([address, address2]);
        });

        it("should POST a search for wallets with the exact specified publicKey", async () => {
            const response = await utils.request("POST", "wallets/search", {
                address,
                publicKey,
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const wallet = response.data.data[0];
            utils.expectWallet(wallet);
            expect(wallet.address).toBe(address);
            expect(wallet.publicKey).toBe(publicKey);
        });

        // it("should POST a search for wallets with the exact specified secondPublicKey", async () => {
        //     const response = await utils.request("POST", "wallets/search", {
        //         address: addressSecondPassphrase,
        //         secondPublicKey,
        //     });
        //     expect(response).toBeSuccessfulResponse();
        //     expect(response.data.data).toBeArray();

        //     expect(response.data.data).toHaveLength(1);

        //     const wallet = response.data.data[0];
        //     utils.expectWallet(wallet);
        //     expect(wallet.address).toBe(addressSecondPassphrase);
        // });

        // it("should POST a search for wallets with the exact specified vote", async () => {
        //     const response = await utils.request("POST", "wallets/search", { address: address, vote });
        //     expect(response).toBeSuccessfulResponse();
        //     expect(response.data.data).toBeArray();

        //     expect(response.data.data).toHaveLength(1);

        //     const wallet = response.data.data[0];
        //     utils.expectWallet(wallet);
        //     expect(wallet.address).toBe(address);
        // });

        it("should POST a search for wallets with the exact specified username", async () => {
            const response = await utils.request("POST", "wallets/search", {
                address,
                username,
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const wallet = response.data.data[0];
            utils.expectWallet(wallet);
            expect(wallet.address).toBe(address);
        });

        it("should POST a search for wallets with the exact specified balance", async () => {
            const response = await utils.request("POST", "wallets/search", {
                address,
                balance: {
                    from: balance,
                    to: balance,
                },
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const wallet = response.data.data[0];
            utils.expectWallet(wallet);
            expect(wallet.address).toBe(address);
            expect(+wallet.balance).toBe(balance);
        });

        it("should POST a search for wallets with the specified balance range", async () => {
            const response = await utils.request("POST", "wallets/search", {
                address,
                balance: {
                    from: balance - 1000,
                    to: balance + 1000,
                },
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const wallet = response.data.data[0];
            utils.expectWallet(wallet);
            expect(wallet.address).toBe(address);
            expect(+wallet.balance).toBe(balance);
        });

        it("should POST a search for wallets with the exact specified voteBalance", async () => {
            const response = await utils.request("POST", "wallets/search", {
                address,
                voteBalance: {
                    from: balance,
                    to: balance,
                },
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const wallet = response.data.data[0];
            utils.expectWallet(wallet);
            expect(wallet.address).toBe(address);
        });

        it("should POST a search for wallets with the wrong specified username", async () => {
            const response = await utils.request("POST", "wallets/search", {
                address,
                username: "dummy",
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(0);
        });

        it("should POST a search for wallets with the specific criteria", async () => {
            const response = await utils.request("POST", "wallets/search", {
                publicKey,
                username,
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const wallet = response.data.data[0];
            utils.expectWallet(wallet);
            expect(wallet.address).toBe(address);
        });
    });
});
