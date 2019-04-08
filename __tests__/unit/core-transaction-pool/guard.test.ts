import "./mocks/core-container";

import { configManager, constants, slots } from "@arkecosystem/crypto";
import "jest-extended";
import { Connection } from "../../../packages/core-transaction-pool/src/connection";
import { defaults } from "../../../packages/core-transaction-pool/src/defaults";
import { TransactionGuard } from "../../../packages/core-transaction-pool/src/guard";
import { MemPoolTransaction } from "../../../packages/core-transaction-pool/src/mem-pool-transaction";
import { TransactionFactory } from "../../helpers/transaction-factory";
import { delegates, wallets } from "../../utils/fixtures/unitnet";
import { database } from "./mocks/database";
import { state } from "./mocks/state";

let guard;
let transactionPool;

beforeAll(async () => {
    localConfig.init(defaults);

    transactionPool = new Connection(defaults);
    await transactionPool.make();
});

beforeEach(async () => {
    transactionPool.flush();

    guard = new TransactionGuard(transactionPool);
});

describe("Transaction Guard", () => {
    describe("__cacheTransactions", () => {
        it("should add transactions to cache", () => {
            const transactions = TransactionFactory.transfer(wallets[11].address, 35)
                .withNetwork("unitnet")
                .withPassphrase(wallets[10].passphrase)
                .create(3);
            jest.spyOn(state, "cacheTransactions").mockReturnValueOnce({ added: transactions, notAdded: [] });

            expect(guard.__cacheTransactions(transactions)).toEqual(transactions);
        });

        it("should not add a transaction already in cache and add it as an error", () => {
            const transactions = TransactionFactory.transfer(wallets[12].address, 35)
                .withNetwork("unitnet")
                .withPassphrase(wallets[11].passphrase)
                .create(3);

            jest.spyOn(state, "cacheTransactions")
                .mockReturnValueOnce({ added: transactions, notAdded: [] })
                .mockReturnValueOnce({ added: [], notAdded: [transactions[0]] });

            expect(guard.__cacheTransactions(transactions)).toEqual(transactions);
            expect(guard.__cacheTransactions([transactions[0]])).toEqual([]);
            expect(guard.errors).toEqual({
                [transactions[0].id]: [
                    {
                        message: "Already in cache.",
                        type: "ERR_DUPLICATE",
                    },
                ],
            });
        });
    });

    describe("getBroadcastTransactions", () => {
        it("should return broadcast transaction", async () => {
            const transactions = TransactionFactory.transfer(wallets[11].address, 25)
                .withNetwork("unitnet")
                .withPassphrase(wallets[10].passphrase)
                .build(3);

            jest.spyOn(state, "cacheTransactions").mockReturnValueOnce({ added: transactions, notAdded: [] });

            for (const tx of transactions) {
                guard.broadcast.set(tx.id, tx);
            }

            expect(guard.getBroadcastTransactions()).toEqual(transactions);
        });
    });

    describe("__filterAndTransformTransactions", () => {
        it("should reject duplicate transactions", () => {
            const transactionExists = guard.pool.transactionExists;
            guard.pool.transactionExists = jest.fn(() => true);

            const tx = { id: "1" };
            guard.__filterAndTransformTransactions([tx]);

            expect(guard.errors[tx.id]).toEqual([
                {
                    message: `Duplicate transaction ${tx.id}`,
                    type: "ERR_DUPLICATE",
                },
            ]);

            guard.pool.transactionExists = transactionExists;
        });

        it("should reject blocked senders", () => {
            const transactionExists = guard.pool.transactionExists;
            guard.pool.transactionExists = jest.fn(() => false);
            const isSenderBlocked = guard.pool.isSenderBlocked;
            guard.pool.isSenderBlocked = jest.fn(() => true);

            const tx = { id: "1", senderPublicKey: "affe" };
            guard.__filterAndTransformTransactions([tx]);

            expect(guard.errors[tx.id]).toEqual([
                {
                    message: `Transaction ${tx.id} rejected. Sender ${tx.senderPublicKey} is blocked.`,
                    type: "ERR_SENDER_BLOCKED",
                },
            ]);

            guard.pool.isSenderBlocked = isSenderBlocked;
            guard.pool.transactionExists = transactionExists;
        });

        it("should reject transactions that are too large", () => {
            const tx = TransactionFactory.transfer(wallets[12].address)
                .withNetwork("unitnet")
                .withPassphrase(wallets[11].passphrase)
                .build(3)[0];

            // @FIXME: Uhm excuse me, what the?
            tx.data.signatures = [""];
            for (let i = 0; i < transactionPool.options.maxTransactionBytes; i++) {
                // @ts-ignore
                tx.data.signatures += "1";
            }
            guard.__filterAndTransformTransactions([tx]);

            expect(guard.errors[tx.id]).toEqual([
                {
                    message: `Transaction ${tx.id} is larger than ${
                        transactionPool.options.maxTransactionBytes
                    } bytes.`,
                    type: "ERR_TOO_LARGE",
                },
            ]);
        });

        it("should reject transactions from the future", () => {
            const now = 47157042; // seconds since genesis block
            const transactionExists = guard.pool.transactionExists;
            guard.pool.transactionExists = jest.fn(() => false);
            const getTime = slots.getTime;
            slots.getTime = jest.fn(() => now);

            const secondsInFuture = 3601;
            const tx = {
                id: "1",
                senderPublicKey: "affe",
                timestamp: slots.getTime() + secondsInFuture,
            };
            guard.__filterAndTransformTransactions([tx]);

            expect(guard.errors[tx.id]).toEqual([
                {
                    message: `Transaction ${tx.id} is ${secondsInFuture} seconds in the future`,
                    type: "ERR_FROM_FUTURE",
                },
            ]);

            slots.getTime = getTime;
            guard.pool.transactionExists = transactionExists;
        });

        it("should accept transaction with correct network byte", () => {
            const transactionExists = guard.pool.transactionExists;
            guard.pool.transactionExists = jest.fn(() => false);

            const canApply = guard.pool.walletManager.canApply;
            guard.pool.walletManager.canApply = jest.fn(() => true);

            const tx = {
                id: "1",
                network: 23,
                type: constants.TransactionTypes.Transfer,
                senderPublicKey: "023ee98f453661a1cb765fd60df95b4efb1e110660ffb88ae31c2368a70f1f7359",
                recipientId: "DEJHR83JFmGpXYkJiaqn7wPGztwjheLAmY",
            };
            guard.__filterAndTransformTransactions([tx]);

            expect(guard.errors[tx.id]).not.toEqual([
                {
                    message: `Transaction network '${tx.network}' does not match '${configManager.get("pubKeyHash")}'`,
                    type: "ERR_WRONG_NETWORK",
                },
            ]);

            guard.pool.transactionExists = transactionExists;
            guard.pool.walletManager.canApply = canApply;
        });

        it("should accept transaction with missing network byte", () => {
            const transactionExists = guard.pool.transactionExists;
            guard.pool.transactionExists = jest.fn(() => false);

            const canApply = guard.pool.walletManager.canApply;
            guard.pool.walletManager.canApply = jest.fn(() => true);

            const tx = {
                id: "1",
                type: constants.TransactionTypes.Transfer,
                senderPublicKey: "023ee98f453661a1cb765fd60df95b4efb1e110660ffb88ae31c2368a70f1f7359",
                recipientId: "DEJHR83JFmGpXYkJiaqn7wPGztwjheLAmY",
            };
            guard.__filterAndTransformTransactions([tx]);

            expect(guard.errors[tx.id].type).not.toEqual("ERR_WRONG_NETWORK");

            guard.pool.transactionExists = transactionExists;
            guard.pool.walletManager.canApply = canApply;
        });

        it("should not accept transaction with wrong network byte", () => {
            const transactionExists = guard.pool.transactionExists;
            guard.pool.transactionExists = jest.fn(() => false);

            const canApply = guard.pool.walletManager.canApply;
            guard.pool.walletManager.canApply = jest.fn(() => true);

            const tx = {
                id: "1",
                network: 2,
                senderPublicKey: "023ee98f453661a1cb765fd60df95b4efb1e110660ffb88ae31c2368a70f1f7359",
            };
            guard.__filterAndTransformTransactions([tx]);

            expect(guard.errors[tx.id]).toEqual([
                {
                    message: `Transaction network '${tx.network}' does not match '${configManager.get("pubKeyHash")}'`,
                    type: "ERR_WRONG_NETWORK",
                },
            ]);

            guard.pool.transactionExists = transactionExists;
            guard.pool.walletManager.canApply = canApply;
        });

        it("should not accept transaction if pool hasExceededMaxTransactions and add it to excess", () => {
            const transactions = TransactionFactory.transfer(wallets[11].address, 35)
                .withNetwork("unitnet")
                .withPassphrase(wallets[10].passphrase)
                .create(3);

            jest.spyOn(guard.pool, "hasExceededMaxTransactions").mockImplementationOnce(tx => true);

            guard.__filterAndTransformTransactions(transactions);

            expect(guard.excess).toEqual([transactions[0].id]);
            expect(guard.accept).toEqual(new Map());
            expect(guard.broadcast).toEqual(new Map());
        });

        it("should push a ERR_UNKNOWN error if something threw in validated transaction block", () => {
            const transactions = TransactionFactory.transfer(wallets[11].address, 35)
                .withNetwork("unitnet")
                .withPassphrase(wallets[10].passphrase)
                .build(3);

            // use guard.accept.set() call to introduce a throw
            jest.spyOn(guard.pool.walletManager, "canApply").mockImplementationOnce(() => {
                throw new Error("hey");
            });

            guard.__filterAndTransformTransactions(transactions.map(tx => tx.data));

            expect(guard.accept).toEqual(new Map());
            expect(guard.broadcast).toEqual(new Map());
            expect(guard.errors[transactions[0].id]).toEqual([
                {
                    message: `hey`,
                    type: "ERR_UNKNOWN",
                },
            ]);
        });
    });

    describe("__validateTransaction", () => {
        it("should not validate when recipient is not on the same network", async () => {
            const transactions = TransactionFactory.transfer("DEJHR83JFmGpXYkJiaqn7wPGztwjheLAmY", 35)
                .withNetwork("unitnet")
                .withPassphrase(wallets[10].passphrase)
                .build(3);

            expect(guard.__validateTransaction(transactions[0].data)).toBeFalse();
            expect(guard.errors).toEqual({
                [transactions[0].id]: [
                    {
                        type: "ERR_INVALID_RECIPIENT",
                        message: `Recipient ${
                            transactions[0].data.recipientId
                        } is not on the same network: ${configManager.get("pubKeyHash")}`,
                    },
                ],
            });
        });

        it("should not validate a delegate registration if an existing registration for the same username from a different wallet exists in the pool", async () => {
            const delegateRegistrations = [
                TransactionFactory.delegateRegistration("test_delegate")
                    .withNetwork("unitnet")
                    .withPassphrase(wallets[16].passphrase)
                    .build()[0],
                TransactionFactory.delegateRegistration("test_delegate")
                    .withNetwork("unitnet")
                    .withPassphrase(wallets[17].passphrase)
                    .build()[0],
            ];
            const memPoolTx = new MemPoolTransaction(delegateRegistrations[0]);
            jest.spyOn(guard.pool, "getTransactionsByType").mockReturnValueOnce(new Set([memPoolTx]));

            expect(guard.__validateTransaction(delegateRegistrations[1].data)).toBeFalse();
            expect(guard.errors[delegateRegistrations[1].id]).toEqual([
                {
                    type: "ERR_PENDING",
                    message: `Delegate registration for "${
                        delegateRegistrations[1].data.asset.delegate.username
                    }" already in the pool`,
                },
            ]);
        });

        it("should not validate when sender has same type transactions in the pool (only for 2nd sig, delegate registration, vote)", async () => {
            jest.spyOn(guard.pool.walletManager, "canApply").mockImplementation(() => true);
            jest.spyOn(guard.pool, "senderHasTransactionsOfType").mockReturnValue(true);
            const vote = TransactionFactory.vote(delegates[0].publicKey)
                .withNetwork("unitnet")
                .withPassphrase(wallets[10].passphrase)
                .build()[0];

            const delegateReg = TransactionFactory.delegateRegistration()
                .withNetwork("unitnet")
                .withPassphrase(wallets[11].passphrase)
                .build()[0];

            const signature = TransactionFactory.secondSignature(wallets[12].passphrase)
                .withNetwork("unitnet")
                .withPassphrase(wallets[12].passphrase)
                .build()[0];

            for (const tx of [vote, delegateReg, signature]) {
                expect(guard.__validateTransaction(tx.data)).toBeFalse();
                expect(guard.errors[tx.id]).toEqual([
                    {
                        type: "ERR_PENDING",
                        message:
                            `Sender ${tx.data.senderPublicKey} already has a transaction of type ` +
                            `'${constants.TransactionTypes[tx.type]}' in the pool`,
                    },
                ]);
            }

            jest.restoreAllMocks();
        });

        it("should not validate unsupported transaction types", async () => {
            jest.spyOn(guard.pool.walletManager, "canApply").mockImplementation(() => true);

            // use a random transaction as a base - then play with type
            const baseTransaction = TransactionFactory.delegateRegistration()
                .withNetwork("unitnet")
                .withPassphrase(wallets[11].passphrase)
                .build()[0];

            for (const transactionType of [
                constants.TransactionTypes.MultiSignature,
                constants.TransactionTypes.Ipfs,
                constants.TransactionTypes.TimelockTransfer,
                constants.TransactionTypes.MultiPayment,
                constants.TransactionTypes.DelegateResignation,
                99,
            ]) {
                baseTransaction.data.type = transactionType;
                // @FIXME: Uhm excuse me, what the?
                // @ts-ignore
                baseTransaction.data.id = transactionType;

                expect(guard.__validateTransaction(baseTransaction)).toBeFalse();
                expect(guard.errors[baseTransaction.id]).toEqual([
                    {
                        type: "ERR_UNSUPPORTED",
                        message: `Invalidating transaction of unsupported type '${
                            constants.TransactionTypes[transactionType]
                        }'`,
                    },
                ]);
            }

            jest.restoreAllMocks();
        });
    });

    describe("__removeForgedTransactions", () => {
        it("should remove forged transactions", async () => {
            const transfers = TransactionFactory.transfer(delegates[0].senderPublicKey)
                .withNetwork("unitnet")
                .withPassphrase(delegates[0].secret)
                .build(4);

            transfers.forEach(tx => {
                guard.accept.set(tx.id, tx);
                guard.broadcast.set(tx.id, tx);
            });

            const forgedTx = transfers[2];
            jest.spyOn(database, "getForgedTransactionsIds").mockReturnValueOnce([forgedTx.id]);

            await guard.__removeForgedTransactions();

            expect(guard.accept.size).toBe(3);
            expect(guard.broadcast.size).toBe(3);

            expect(guard.errors[forgedTx.id]).toHaveLength(1);
            expect(guard.errors[forgedTx.id][0].type).toEqual("ERR_FORGED");
        });
    });

    describe("__addTransactionsToPool", () => {
        it("should add transactions to the pool", () => {
            const transfers = TransactionFactory.transfer(delegates[0].senderPublicKey)
                .withNetwork("unitnet")
                .withPassphrase(delegates[0].secret)
                .create(4);

            transfers.forEach(tx => {
                guard.accept.set(tx.id, tx);
                guard.broadcast.set(tx.id, tx);
            });

            expect(guard.errors).toEqual({});
            jest.spyOn(guard.pool, "addTransactions").mockReturnValueOnce({ added: transfers, notAdded: [] });

            guard.__addTransactionsToPool();

            expect(guard.errors).toEqual({});
            expect(guard.accept.size).toBe(4);
            expect(guard.broadcast.size).toBe(4);
        });

        it("should delete from accept and broadcast transactions that were not added to the pool", () => {
            const added = TransactionFactory.transfer(delegates[0].address)
                .withNetwork("unitnet")
                .withPassphrase(delegates[0].secret)
                .build(2);
            const notAddedError = { type: "ERR_TEST", message: "" };
            const notAdded = TransactionFactory.transfer(delegates[1].address)
                .withNetwork("unitnet")
                .withPassphrase(delegates[0].secret)
                .build(2)
                .map(tx => ({
                    transaction: tx,
                    ...notAddedError,
                }));

            added.forEach(tx => {
                guard.accept.set(tx.id, tx);
                guard.broadcast.set(tx.id, tx);
            });
            notAdded.forEach(tx => {
                guard.accept.set(tx.transaction.id, tx);
                guard.broadcast.set(tx.transaction.id, tx);
            });

            jest.spyOn(guard.pool, "addTransactions").mockReturnValueOnce({ added, notAdded });
            guard.__addTransactionsToPool();

            expect(guard.accept.size).toBe(2);
            expect(guard.broadcast.size).toBe(2);

            expect(guard.errors[notAdded[0].transaction.id]).toEqual([notAddedError]);
            expect(guard.errors[notAdded[1].transaction.id]).toEqual([notAddedError]);
        });

        it("should delete from accept but keep in broadcast transactions that were not added to the pool because of ERR_POOL_FULL", () => {
            const added = TransactionFactory.transfer(delegates[0].address)
                .withNetwork("unitnet")
                .withPassphrase(delegates[0].secret)
                .build(2);

            const notAddedError = { type: "ERR_POOL_FULL", message: "" };
            const notAdded = TransactionFactory.transfer(delegates[1].address)
                .withNetwork("unitnet")
                .withPassphrase(delegates[0].secret)
                .build(2)
                .map(tx => ({
                    transaction: tx,
                    ...notAddedError,
                }));

            added.forEach(tx => {
                guard.accept.set(tx.id, tx);
                guard.broadcast.set(tx.id, tx);
            });
            notAdded.forEach(tx => {
                guard.accept.set(tx.transaction.id, tx);
                guard.broadcast.set(tx.transaction.id, tx);
            });

            jest.spyOn(guard.pool, "addTransactions").mockReturnValueOnce({ added, notAdded });
            guard.__addTransactionsToPool();

            expect(guard.accept.size).toBe(2);
            expect(guard.broadcast.size).toBe(4);

            expect(guard.errors[notAdded[0].transaction.id]).toEqual([notAddedError]);
            expect(guard.errors[notAdded[1].transaction.id]).toEqual([notAddedError]);
        });
    });

    describe("pushError", () => {
        it("should have error for transaction", () => {
            expect(guard.errors).toBeEmpty();

            guard.pushError({ id: 1 }, "ERR_INVALID", "Invalid.");

            expect(guard.errors).toBeObject();
            expect(guard.errors["1"]).toBeArray();
            expect(guard.errors["1"]).toHaveLength(1);
            expect(guard.errors["1"]).toEqual([{ message: "Invalid.", type: "ERR_INVALID" }]);

            expect(guard.invalid.size).toEqual(1);
            expect(guard.invalid.entries().next().value[1]).toEqual({ id: 1 });
        });

        it("should have multiple errors for transaction", () => {
            expect(guard.errors).toBeEmpty();

            guard.pushError({ id: 1 }, "ERR_INVALID", "Invalid 1.");
            guard.pushError({ id: 1 }, "ERR_INVALID", "Invalid 2.");

            expect(guard.errors).toBeObject();
            expect(guard.errors["1"]).toBeArray();
            expect(guard.errors["1"]).toHaveLength(2);
            expect(guard.errors["1"]).toEqual([
                { message: "Invalid 1.", type: "ERR_INVALID" },
                { message: "Invalid 2.", type: "ERR_INVALID" },
            ]);

            expect(guard.invalid.size).toEqual(1);
            expect(guard.invalid.entries().next().value[1]).toEqual({ id: 1 });
        });
    });
});
