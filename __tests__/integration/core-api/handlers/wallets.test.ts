import "../../../utils";

import { app } from "@arkecosystem/core-container";
import { Database, State } from "@arkecosystem/core-interfaces";
import { Identities, Utils } from "@arkecosystem/crypto";
import { genesisBlock } from "../../../utils/fixtures/testnet/block-model";
import { setUp, tearDown } from "../__support__/setup";
import { utils } from "../utils";

const username = "genesis_9";
const address = "AG8kwwk4TsYfA2HdwaWBVAJQBj6VhdcpMo";
const publicKey = "0377f81a18d25d77b100cb17e829a72259f08334d064f6c887298917a04df8f647";
const balance = 245098000000000;
const address2 = "AJjv7WztjJNYHrLAeveG5NgHWp6699ZJwD";

const validIdentifiers = {
    username,
    address,
    publicKey,
};

const invalidIdentifiers = [
    "invalid-username",
    "invalidUsername",
    "longAndInvalidUsername",
    "AG8kwwk4TsYfA2HdwaWBVAJQBj6Vhdc__",
    "AG8kwwk4TsYfA2HdwaWBVAJQBj6Vhdc___",
    "AG8kwwk4TsYfA2HdwaWBVAJQBj6Vhdc____",
    "0377f81a18d25d77b100cb17e829a72259f08334d064f6c887298917a04df8fxx",
    "0377f81a18d25d77b100cb17e829a72259f08334d064f6c887298917a04df8fxxx",
    "0377f81a18d25d77b100cb17e829a72259f08334d064f6c887298917a04df8fxxxx",
];

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
            expect(response.data.data[0].balance).toBe("-12500000000000000");
        });

        it("should GET all the wallets sorted by balance,desc", async () => {
            const response = await utils.request("GET", "wallets", { orderBy: "balance:desc" });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data[0].address).toBe("ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo");
            expect(response.data.data[0].balance).toBe("245100000000000");
        });

        it("should give correct meta data", async () => {
            const response = await utils.request("GET", "wallets");
            expect(response).toBeSuccessfulResponse();

            const expectedMeta = {
                count: 53,
                first: "/wallets?page=1&limit=100",
                last: "/wallets?page=1&limit=100",
                next: null,
                pageCount: 1,
                previous: null,
                self: "/wallets?page=1&limit=100",
                totalCount: 53,
            };
            expect(response.data.meta).toEqual(expectedMeta);
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
        it("should GET a wallet by the given valid identifier", async () => {
            for (const [identifier, value] of Object.entries(validIdentifiers)) {
                const response = await utils.request("GET", `wallets/${value}`);
                expect(response).toBeSuccessfulResponse();
                expect(response.data.data).toBeObject();

                const wallet = response.data.data;
                utils.expectWallet(wallet);

                expect(wallet[identifier]).toBe(value);
            }
        });

        it("should fail to GET a wallet by the given invalid identifier", async () => {
            for (const value of invalidIdentifiers) {
                utils.expectError(await utils.request("GET", `wallets/${value}`), 422);
            }
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
    });

    describe("GET /wallets/:id/transactions/sent", () => {
        it("should GET all the send transactions for the given wallet by id", async () => {
            const response = await utils.request("GET", `wallets/${address}/transactions/sent`);
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            const transaction = response.data.data[0];
            utils.expectTransaction(transaction);
            expect(transaction.sender).toBe(address);
        });

        it("should fail to GET all the sent transactions for the given wallet if it doesn't exist", async () => {
            utils.expectError(await utils.request("GET", "wallets/fake_address/transactions/sent"), 404);
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
            utils.expectError(await utils.request("GET", "wallets/fake_address/transactions/received"), 404);
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
            utils.expectError(await utils.request("GET", "wallets/fake_address/votes"), 404);
        });
    });

    describe("GET /wallets/:id/locks", () => {
        let walletManager: State.IWalletManager;
        let wallets;
        let lockIds;

        beforeAll(() => {
            walletManager = app.resolvePlugin<Database.IDatabaseService>("database").walletManager;

            wallets = [
                walletManager.findByPublicKey(Identities.PublicKey.fromPassphrase("1")),
                walletManager.findByPublicKey(Identities.PublicKey.fromPassphrase("2")),
                walletManager.findByPublicKey(Identities.PublicKey.fromPassphrase("3")),
                walletManager.findByPublicKey(Identities.PublicKey.fromPassphrase("4")),
                walletManager.findByPublicKey(Identities.PublicKey.fromPassphrase("5")),
                walletManager.findByPublicKey(Identities.PublicKey.fromPassphrase("6")),
            ];

            lockIds = [];

            for (let i = 0; i < wallets.length; i++) {
                const wallet = wallets[i];
                const transactions = genesisBlock.transactions.slice(i * 10, i * 10 + i + 1);

                const locks = {};
                for (let j = 0; j < transactions.length; j++) {
                    const transaction = transactions[j];
                    lockIds.push(transaction.id);

                    locks[transaction.id] = {
                        amount: Utils.BigNumber.make(10 * (j + 1)),
                        recipientId: wallet.address,
                        secretHash: transaction.id,
                        expiration: {
                            type: j % 2 === 0 ? 1 : 2,
                            value: 100 * (j + 1),
                        },
                        timestamp: 0,
                    };
                }

                wallet.setAttribute("htlc.locks", locks);
            }

            walletManager.index(wallets);
        });

        it("should GET all locks for the given wallet by id", async () => {
            const response = await utils.request("GET", `wallets/${wallets[0].address}/locks`);
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(1);
            utils.expectLock(response.data.data[0]);
        });

        it("should fail to GET locks for the given wallet if it doesn't exist", async () => {
            utils.expectError(await utils.request("GET", "wallets/fake_address/locks"), 404);
        });

        it("should GET all locks for the given wallet in the given order", async () => {
            const response = await utils.request("GET", `wallets/${wallets[5].address}/locks`, {
                orderBy: "amount:desc",
            });

            for (let i = 0; i < response.data.data.length - 1; i++) {
                const lockA = response.data.data[i];
                const lockB = response.data.data[i + 1];

                expect(Utils.BigNumber.make(lockA.amount).isGreaterThanEqual(lockB.amount)).toBeTrue();
            }
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

        it("should POST a search for wallets with the exact specified secondPublicKey", async () => {
            const walletManager = app.resolvePlugin<Database.IDatabaseService>("database").walletManager;

            const walletPublicKey = Identities.PublicKey.fromPassphrase("second");
            const walletAddress = Identities.Address.fromPublicKey(walletPublicKey);
            const wallet2ndPublicKey = Identities.PublicKey.fromPassphrase("second");
            const walletWith2ndPublicKey = walletManager.findByPublicKey(walletPublicKey);

            walletWith2ndPublicKey.setAttribute("secondPublicKey", wallet2ndPublicKey);
            walletManager.reindex(walletWith2ndPublicKey);

            const response = await utils.request("POST", "wallets/search", {
                address: walletAddress,
                secondPublicKey: wallet2ndPublicKey,
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(1);
            const wallet = response.data.data[0];
            utils.expectWallet(wallet);
            expect(wallet.address).toBe(walletAddress);
            expect(wallet.secondPublicKey).toBe(wallet2ndPublicKey);

            walletManager.forgetByPublicKey(walletPublicKey);
        });

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
