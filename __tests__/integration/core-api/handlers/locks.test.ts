import "../../../utils";

import { app } from "@arkecosystem/core-container";
import { Database, State } from "@arkecosystem/core-interfaces";
import { Crypto, Identities, Interfaces, Utils } from "@arkecosystem/crypto";
import { TransactionFactory } from "../../../helpers";
import { genesisBlock } from "../../../utils/fixtures/testnet/block-model";
import { setUp, tearDown } from "../__support__/setup";
import { utils } from "../utils";

beforeAll(async () => await setUp());
afterAll(async () => await tearDown());

describe("API 2.0 - Locks", () => {
    let wallets: State.IWallet[];
    let lockIds;
    let walletManager;

    beforeEach(() => {
        walletManager = app.resolvePlugin("database").walletManager;
        walletManager.reset();

        wallets = [
            walletManager.findByAddress(Identities.Address.fromPassphrase("1")),
            walletManager.findByAddress(Identities.Address.fromPassphrase("2")),
            walletManager.findByAddress(Identities.Address.fromPassphrase("3")),
            walletManager.findByAddress(Identities.Address.fromPassphrase("4")),
            walletManager.findByAddress(Identities.Address.fromPassphrase("5")),
            walletManager.findByAddress(Identities.Address.fromPassphrase("6")),
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
                        value: !j ? 0 : 100 * (j + 1),
                    },
                    timestamp: (i + 1) * 100000,
                };
            }

            wallet.setAttribute("htlc.locks", locks);
        }

        walletManager.index(wallets);
    });

    describe("GET /locks", () => {
        it("should GET all the locks", async () => {
            const response = await utils.request("GET", "locks");
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            utils.expectLock(response.data.data[0]);
        });

        it("should give correct meta data", async () => {
            const response = await utils.request("GET", "locks");
            expect(response).toBeSuccessfulResponse();

            const numberOfLocks = wallets.reduce(
                (acc, curr) => acc + Object.keys(curr.getAttribute("htlc.locks")).length,
                0,
            );
            const expectedMeta = {
                count: numberOfLocks,
                first: "/locks?page=1&limit=100",
                last: "/locks?page=1&limit=100",
                next: null,
                pageCount: 1,
                previous: null,
                self: "/locks?page=1&limit=100",
                totalCount: numberOfLocks,
            };
            expect(response.data.meta).toEqual(expectedMeta);
        });

        it("should GET all the locks sorted by expirationValue,asc", async () => {
            const response = await utils.request("GET", "locks", { orderBy: "expirationValue:asc" });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data[0].expirationValue).toBe(0);
        });

        it("should GET all the locks by epoch expiration", async () => {
            const response = await utils.request("GET", "locks", { expirationType: 1 });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).not.toBeEmpty();
            expect(response.data.data.every(lock => lock.expirationType === 1)).toBeTrue();
        });

        it("should GET all the locks by height expiration", async () => {
            const response = await utils.request("GET", "locks", { expirationType: 2 });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).not.toBeEmpty();
            expect(response.data.data.every(lock => lock.expirationType === 2)).toBeTrue();
        });

        it("should GET all the locks that are expired", async () => {
            const response = await utils.request("GET", "locks", { isExpired: true });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).not.toBeEmpty();
            expect(response.data.data.every(lock => lock.isExpired)).toBeTrue();
        });

        it("should GET all the locks that are not expired", async () => {
            const response = await utils.request("GET", "locks", { isExpired: false });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).not.toBeEmpty();
            expect(response.data.data.every(lock => !lock.isExpired)).toBeTrue();
        });

        describe("orderBy", () => {
            it("should be ordered by amount:desc", async () => {
                const response = await utils.request("GET", "locks", { orderBy: "amount:desc", expirationType: 2 });
                expect(response).toBeSuccessfulResponse();
                expect(response.data.data).toBeArray();

                for (let i = 0; i < response.data.data.length - 1; i++) {
                    const lockA = response.data.data[i];
                    const lockB = response.data.data[i + 1];

                    expect(Utils.BigNumber.make(lockA.amount).isGreaterThanEqual(lockB.amount)).toBeTrue();
                }
            });

            it("should be ordered by amount:asc", async () => {
                const response = await utils.request("GET", "locks", { orderBy: "amount:asc", expirationType: 2 });
                expect(response).toBeSuccessfulResponse();
                expect(response.data.data).toBeArray();

                for (let i = 0; i < response.data.data.length - 1; i++) {
                    const lockA = response.data.data[i];
                    const lockB = response.data.data[i + 1];

                    expect(Utils.BigNumber.make(lockA.amount).isLessThanEqual(lockB.amount)).toBeTrue();
                }
            });
        });
    });

    describe("GET /locks/:id", () => {
        it("should GET a wallet by the given identifier", async () => {
            const response = await utils.request("GET", `locks/${lockIds[0]}`);
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeObject();

            const lock = response.data.data;
            utils.expectLock(lock);
            expect(lock.lockId).toBe(lockIds[0]);
        });

        describe("when requesting an unknown lock", () => {
            it("should return ResourceNotFound error", async () => {
                try {
                    await utils.request("GET", "locks/dummy");
                } catch (error) {
                    expect(error.response.status).toEqual(404);
                }
            });
        });
    });

    describe("POST /locks/search", () => {
        const createWallet = (secret: string, lock: Partial<Interfaces.IHtlcLock> = {}) => {
            const wallet = walletManager.findByPublicKey(Identities.PublicKey.fromPassphrase(secret));
            const transactionId = Crypto.HashAlgorithms.sha256(secret).toString("hex");

            wallet.setAttribute("htlc.locks", {
                [transactionId]: {
                    ...{
                        amount: Utils.BigNumber.make(10000),
                        recipientId: wallet.address,
                        secretHash: transactionId,
                        expiration: {
                            type: 1,
                            value: 1000000,
                        },
                        timestamp: 9999,
                        vendorField: "HTLC",
                    },
                    ...lock,
                },
            });

            return wallet;
        };

        it("should POST a search for locks with the exact specified lockId", async () => {
            const response = await utils.request("POST", "locks/search", {
                lockId: lockIds[0],
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const lock = response.data.data[0];
            utils.expectLock(lock);
            expect(lock.lockId).toBe(lockIds[0]);
        });

        it("should POST a search for locks with the exact vendorField", async () => {
            const wallet = createWallet("secret", { vendorField: "HTLC" });
            walletManager.reindex(wallet);

            const response = await utils.request("POST", "locks/search", {
                vendorField: "HTLC",
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const lock = response.data.data[0];
            utils.expectLock(lock);
            expect(lock.vendorField).toBe("HTLC");
        });

        it("should POST a search for locks within the timestamp range", async () => {
            const wallet = createWallet("secret", { timestamp: 5000 });
            walletManager.reindex(wallet);

            const response = await utils.request("POST", "locks/search", {
                timestamp: {
                    from: 4000,
                    to: 6000,
                },
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const lock = response.data.data[0];
            utils.expectLock(lock);
            expect(lock.timestamp.unix).toBe(1490106200);
            expect(lock.timestamp.epoch).toBe(5000);
            expect(lock.timestamp.human).toBe("2017-03-21T14:23:20.000Z");
        });
    });

    describe("POST /locks/unlocked", () => {
        it("should find matching transactions for the given lock ids", async () => {
            const refundTransaction = TransactionFactory.htlcRefund({
                lockTransactionId: lockIds[0],
            }).build()[0];

            const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");

            jest.spyOn(databaseService.transactionsBusinessRepository, "findByHtlcLocks").mockResolvedValueOnce([
                refundTransaction as any,
            ]);

            const response = await utils.request("POST", "locks/unlocked", {
                ids: [lockIds[0]],
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(1);
            expect(refundTransaction.id).toEqual(response.data.data[0].id);
        });
    });
});
