import "jest-extended";
import "../../../utils";

import { crypto } from "@arkecosystem/crypto";
// noinspection TypeScriptPreferShortImport
import { TransactionsRepository } from "../../../../packages/core-api/src/repositories/transactions";
import genesisBlock from "../../../utils/config/testnet/genesisBlock.json";
import { setUp, tearDown } from "../__support__/setup";

let repository;
let genesisTransaction;

beforeAll(async () => {
    await setUp();

    repository = new TransactionsRepository();

    genesisTransaction = genesisBlock.transactions[0];
});

afterAll(async () => {
    await tearDown();
});

describe("Transaction Repository", () => {
    describe("search", () => {
        const expectSearch = async (paramsOrTransactions, count = 1) => {
            let transactions;
            if (paramsOrTransactions.rows) {
                transactions = paramsOrTransactions;
            } else {
                transactions = await repository.search(paramsOrTransactions);
            }

            expect(transactions).toBeObject();

            expect(transactions.count).toBeNumber();
            // expect(transactions.count).toBe(count);

            expect(transactions.rows).toBeArray();
            if (count > 0) {
                expect(transactions.rows).not.toBeEmpty();
                transactions.rows.forEach(transaction => {
                    expect(transaction).toContainKeys([
                        "id",
                        "version",
                        "sequence",
                        "timestamp",
                        "type",
                        "amount",
                        "fee",
                        "serialized",
                        "blockId",
                        "senderPublicKey",
                        "vendorFieldHex",
                        "block",
                    ]);
                });
            }
        };

        it("should search transactions by the specified `id`", async () => {
            await expectSearch({ id: genesisTransaction.id });
        });

        it("should search transactions by the specified `blockId`", async () => {
            await expectSearch({ blockId: genesisTransaction.blockId }, 153);
        });

        it("should search transactions by the specified `type`", async () => {
            await expectSearch({ type: genesisTransaction.type }, 51);
        });

        it("should search transactions by the specified `version`", async () => {
            await expectSearch({ version: genesisTransaction.version }, 153);
        });

        it("should search transactions by the specified `senderPublicKey`", async () => {
            await expectSearch({ senderPublicKey: genesisTransaction.senderPublicKey }, 51);
        });

        describe("`senderId`", () => {
            it("should search transactions by the specified `senderId`", async () => {
                const senderPublicKey = genesisTransaction.senderPublicKey;
                const senderId = crypto.getAddress(senderPublicKey, 23);

                const transactions = await repository.search({ senderId });

                await expectSearch(transactions, 51);

                for (const row of transactions.rows) {
                    expect(row.senderPublicKey).toEqual(senderPublicKey);
                }
            });

            describe("when the `senderId` is incorrect", () => {
                it("should return no result", async () => {
                    const senderId = "unknown";
                    await expectSearch({ senderId }, 0);
                });
            });
        });

        it("should search transactions by the specified `recipientId`", async () => {
            await expectSearch({ recipientId: genesisTransaction.recipientId }, 2);
        });

        describe("when searching by `senderPublicKey` and `recipientId`", () => {
            it("should search transactions by sent by `senderPublicKey` to `recipientId`", async () => {
                const senderPublicKey = genesisTransaction.senderPublicKey;
                const recipientId = genesisBlock.transactions[2].recipientId;

                let transactions = await repository.search({
                    recipientId,
                    senderPublicKey,
                });

                await expectSearch(transactions, 1);

                for (const row of transactions.rows) {
                    expect(row.senderPublicKey).toEqual(senderPublicKey);
                    expect(row.recipientId).toEqual(recipientId);
                }

                transactions = await repository.search({
                    recipientId: "unknown",
                    senderPublicKey,
                });

                await expectSearch(transactions, 0);
            });
        });

        describe("when searching by `senderId` and `recipientId`", () => {
            it("should search transactions by sent by `senderId` to `recipientId`", async () => {
                const senderId = crypto.getAddress(genesisTransaction.senderPublicKey, 23);
                const recipientId = genesisBlock.transactions[2].recipientId;

                let transactions = await repository.search({
                    recipientId,
                    senderId,
                });

                await expectSearch(transactions, 1);

                for (const row of transactions.rows) {
                    expect(row.senderPublicKey).toEqual(genesisTransaction.senderPublicKey);
                    expect(row.recipientId).toEqual(recipientId);
                }

                transactions = await repository.search({
                    recipientId: "unknown",
                    senderId,
                });

                await expectSearch(transactions, 0);
            });
        });

        describe("`addresses`", () => {
            const addresses = [genesisBlock.transactions[1].recipientId, genesisBlock.transactions[4].recipientId];

            it("should search transactions by the specified `addresses` (sender and recipient)", async () => {
                await expectSearch({ addresses: [addresses[0]] }, 3);

                await expectSearch({ addresses }, 6);
            });

            describe("when `addresses` is empty", () => {
                it("should return all transactions", async () => {
                    await expectSearch({ address: [] }, 153);
                });
            });

            describe("when searching by `addresses` and `senderId`", () => {
                it("should search transactions by the `addresses`, but only include those received from `senderId`", async () => {
                    const senderId = crypto.getAddress(genesisTransaction.senderPublicKey, 23);

                    let transactions = await repository.search({
                        senderId,
                        addresses,
                    });

                    await expectSearch(transactions, 2);

                    for (const row of transactions.rows) {
                        expect(row.senderPublicKey).toEqual(genesisTransaction.senderPublicKey);
                    }

                    transactions = await repository.search({
                        senderId: "unknown",
                        addresses,
                    });

                    await expectSearch(transactions, 0);
                });
            });

            describe("when searching by `addresses` and `senderPublicKey`", () => {
                it("should search transactions by the `addresses`, but only include those received from `senderPublicKey`", async () => {
                    const { senderPublicKey } = genesisTransaction;

                    let transactions = await repository.search({
                        senderPublicKey,
                        addresses,
                    });

                    await expectSearch(transactions, 2);

                    for (const row of transactions.rows) {
                        expect(row.senderPublicKey).toEqual(senderPublicKey);
                    }

                    transactions = await repository.search({
                        senderPublicKey: "unknown",
                        addresses,
                    });

                    await expectSearch(transactions, 0);
                });
            });

            describe("when searching by `addresses` and `recipientId`", () => {
                it("should search transactions by the `addresses`, but only include those sent to `recipientId`", async () => {
                    const senderId = crypto.getAddress(genesisTransaction.senderPublicKey, 23);
                    const recipientId = genesisBlock.transactions[2].recipientId;

                    let transactions = await repository.search({
                        recipientId,
                        addresses: [senderId],
                    });

                    await expectSearch(transactions, 1);

                    for (const row of transactions.rows) {
                        expect(row.recipientId).toEqual(recipientId);
                    }

                    transactions = await repository.search({
                        recipientId: "unknown",
                        addresses,
                    });

                    await expectSearch(transactions, 0);
                });
            });

            describe("when searching by `addresses`, `senderId` and `recipientId`", () => {
                it("should search transactions by `senderId` and `recipientId` only", async () => {
                    const senderId = crypto.getAddress(genesisTransaction.senderPublicKey, 23);
                    const params = {
                        senderId,
                        recipientId: genesisTransaction.recipientId,
                        addresses,
                    };
                    const transactions = await repository.search(params);

                    await expectSearch(transactions, 1);

                    const { rows } = transactions;
                    expect(rows[0].senderPublicKey).toEqual(genesisTransaction.senderPublicKey);
                    expect(rows[0].recipientId).toEqual(genesisTransaction.recipientId);
                });
            });

            describe("when searching by `addresses`, `senderPublicKey` and `recipientId`", () => {
                it("should search transactions by `senderPublicKey` and `recipientId` only", async () => {
                    const params = {
                        senderPublicKey: genesisTransaction.senderPublicKey,
                        recipientId: genesisTransaction.recipientId,
                        addresses,
                    };
                    const transactions = await repository.search(params);

                    await expectSearch(transactions, 1);

                    const { rows } = transactions;
                    expect(rows[0].senderPublicKey).toEqual(genesisTransaction.senderPublicKey);
                    expect(rows[0].recipientId).toEqual(genesisTransaction.recipientId);
                });
            });

            describe("when searching by `addresses` and other field`", () => {
                it("should search transactions by the specified `addresses` and that field", async () => {
                    const amount = 245098000000000;
                    const transactions = await repository.search({
                        amount: { from: amount },
                        addresses,
                    });

                    await expectSearch(transactions, 2);

                    for (const row of transactions.rows) {
                        expect(row.amount).toEqual(amount.toString());
                    }
                });
            });
        });

        it("should search transactions by the specified `timestamp`", async () => {
            await expectSearch(
                {
                    timestamp: {
                        from: genesisTransaction.timestamp,
                        to: genesisTransaction.timestamp,
                    },
                },
                153,
            );
        });

        it("should search transactions by the specified `amount`", async () => {
            await expectSearch(
                {
                    amount: {
                        from: genesisTransaction.amount,
                        to: genesisTransaction.amount,
                    },
                },
                50,
            );
        });

        it("should search transactions by the specified `fee`", async () => {
            await expectSearch(
                {
                    fee: {
                        from: genesisTransaction.fee,
                        to: genesisTransaction.fee,
                    },
                },
                153,
            );
        });

        it("should search transactions by the specified `vendorFieldHex`", async () => {
            await expectSearch({ vendorFieldHex: genesisTransaction.vendorFieldHex }, 153);
        });

        describe("when there are more than 1 condition", () => {
            it("should search transactions that includes all of them (AND)", async () => {
                await expectSearch({ recipientId: genesisTransaction.recipientId, type: 3 });
            });
        });

        describe("when no results", () => {
            it("should not return them", async () => {
                const transactions = await repository.search({ recipientId: "dummy" });
                expect(transactions).toBeObject();

                expect(transactions).toHaveProperty("count", 0);

                expect(transactions.rows).toBeArray();
                expect(transactions.rows).toBeEmpty();
            });
        });
    });
});
