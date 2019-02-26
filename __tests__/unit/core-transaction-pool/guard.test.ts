import { Container } from "@arkecosystem/core-interfaces";
import { generators } from "../../utils";
import { configManager, constants, crypto, models, slots } from "@arkecosystem/crypto";
import bip39 from "bip39";
import "jest-extended";
import { delegates, genesisBlock, wallets, wallets2ndSig } from "../../utils/fixtures/unitnet";
import { config as localConfig } from "../../../packages/core-transaction-pool/src/config";
import { setUpFull, tearDownFull } from "./__support__/setup";

const { Block } = models;
const {
    generateDelegateRegistration,
    generateSecondSignature,
    generateTransfers,
    generateVote,
    generateWallets,
} = generators;

let TransactionGuard;

let container: Container.IContainer;
let guard;
let transactionPool;
let blockchain;

beforeAll(async () => {
    container = await setUpFull();

    TransactionGuard = require("../../../packages/core-transaction-pool/src").TransactionGuard;

    transactionPool = container.resolvePlugin("transactionPool");
    blockchain = container.resolvePlugin("blockchain");
    localConfig.init(transactionPool.options);
});

afterAll(async () => {
    await tearDownFull();
});

beforeEach(() => {
    transactionPool.flush();
    guard = new TransactionGuard(transactionPool);
});

describe("Transaction Guard", () => {
    describe("__cacheTransactions", () => {
        it("should add transactions to cache", () => {
            const transactions = generateTransfers("unitnet", wallets[10].passphrase, wallets[11].address, 35, 3);
            expect(guard.__cacheTransactions(transactions)).toEqual(transactions);
        });

        it("should not add a transaction already in cache and add it as an error", () => {
            const transactions = generateTransfers("unitnet", wallets[11].passphrase, wallets[12].address, 35, 3);
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
            const transactions = generateTransfers("unitnet", wallets[10].passphrase, wallets[11].address, 25, 3);

            await guard.validate(transactions);
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
            const tx = generateTransfers("unitnet", wallets[11].passphrase, wallets[12].address, 1, 3)[0];
            tx.data.signatures = [""];
            for (let i = 0; i < transactionPool.options.maxTransactionBytes; i++) {
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
                senderPublicKey: "023ee98f453661a1cb765fd60df95b4efb1e110660ffb88ae31c2368a70f1f7359",
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
                senderPublicKey: "023ee98f453661a1cb765fd60df95b4efb1e110660ffb88ae31c2368a70f1f7359",
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
            const transactions = generateTransfers("unitnet", wallets[10].passphrase, wallets[11].address, 35, 1);

            jest.spyOn(guard.pool, "hasExceededMaxTransactions").mockImplementationOnce(tx => true);

            guard.__filterAndTransformTransactions(transactions);

            expect(guard.excess).toEqual([transactions[0].id]);
            expect(guard.accept).toEqual(new Map());
            expect(guard.broadcast).toEqual(new Map());
        });

        it("should push a ERR_UNKNOWN error if something threw in validated transaction block", () => {
            const transactions = generateTransfers("unitnet", wallets[10].passphrase, wallets[11].address, 35, 1);

            // use guard.accept.set() call to introduce a throw
            jest.spyOn(guard.accept, "set").mockImplementationOnce(() => {
                throw new Error("hey");
            });

            guard.__filterAndTransformTransactions(transactions);

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
            const transactions = generateTransfers(
                "unitnet",
                wallets[10].passphrase,
                "DEJHR83JFmGpXYkJiaqn7wPGztwjheLAmY",
                35,
                1,
            );

            expect(guard.__validateTransaction(transactions[0])).toBeFalse();
            expect(guard.errors).toEqual({
                [transactions[0].id]: [
                    {
                        type: "ERR_INVALID_RECIPIENT",
                        message: `Recipient ${
                            transactions[0].recipientId
                        } is not on the same network: ${configManager.get("pubKeyHash")}`,
                    },
                ],
            });
        });

        it("should not validate a delegate registration if an existing registration for the same username from a different wallet exists in the pool", async () => {
            const delegateRegistrations = [
                generateDelegateRegistration("unitnet", wallets[16].passphrase, 1, false, "test_delegate")[0],
                generateDelegateRegistration("unitnet", wallets[17].passphrase, 1, false, "test_delegate")[0],
            ];

            expect(guard.__validateTransaction(delegateRegistrations[0])).toBeTrue();
            guard.accept.set(delegateRegistrations[0].id, delegateRegistrations[0]);
            guard.__addTransactionsToPool();
            expect(guard.errors).toEqual({});
            expect(guard.__validateTransaction(delegateRegistrations[1])).toBeFalse();
            expect(guard.errors[delegateRegistrations[1].id]).toEqual([
                {
                    type: "ERR_PENDING",
                    message: `Delegate registration for "${
                        delegateRegistrations[1].asset.delegate.username
                    }" already in the pool`,
                },
            ]);

            const wallet1 = transactionPool.walletManager.findByPublicKey(wallets[16].keys.publicKey);
            const wallet2 = transactionPool.walletManager.findByPublicKey(wallets[17].keys.publicKey);

            expect(wallet1.username).toBe("test_delegate");
            expect(wallet2.username).toBe(null);
        });

        it("should not validate when sender has same type transactions in the pool (only for 2nd sig, delegate registration, vote)", async () => {
            jest.spyOn(guard.pool.walletManager, "canApply").mockImplementation(() => true);
            const votes = [
                generateVote("unitnet", wallets[10].passphrase, delegates[0].publicKey, 1)[0],
                generateVote("unitnet", wallets[10].passphrase, delegates[1].publicKey, 1)[0],
            ];
            const delegateRegs = generateDelegateRegistration("unitnet", wallets[11].passphrase, 2);
            const signatures = generateSecondSignature("unitnet", wallets[12].passphrase, 2);

            for (const transactions of [votes, delegateRegs, signatures]) {
                await guard.validate([transactions[0]]);
                expect(guard.__validateTransaction(transactions[1])).toBeFalse();
                expect(guard.errors[transactions[1].id]).toEqual([
                    {
                        type: "ERR_PENDING",
                        message:
                            `Sender ${transactions[1].senderPublicKey} already has a transaction of type ` +
                            `'${constants.TransactionTypes[transactions[1].type]}' in the pool`,
                    },
                ]);
            }

            jest.restoreAllMocks();
        });

        it("should not validate unsupported transaction types", async () => {
            jest.spyOn(guard.pool.walletManager, "canApply").mockImplementation(() => true);

            // use a random transaction as a base - then play with type
            const baseTransaction = generateDelegateRegistration("unitnet", wallets[11].passphrase, 1)[0];

            for (const transactionType of [
                constants.TransactionTypes.MultiSignature,
                constants.TransactionTypes.Ipfs,
                constants.TransactionTypes.TimelockTransfer,
                constants.TransactionTypes.MultiPayment,
                constants.TransactionTypes.DelegateResignation,
                99,
            ]) {
                baseTransaction.type = transactionType;
                baseTransaction.id = transactionType;

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
            const database = container.resolvePlugin("database");
            const getForgedTransactionsIds = database.getForgedTransactionsIds;

            const transfers = generateTransfers("unitnet", delegates[0].secret, delegates[0].senderPublicKey, 1, 4);

            transfers.forEach(tx => {
                guard.accept.set(tx.id, tx);
                guard.broadcast.set(tx.id, tx);
            });

            const forgedTx = transfers[2];
            database.getForgedTransactionsIds = jest.fn(() => [forgedTx.id]);

            await guard.__removeForgedTransactions();

            expect(guard.accept.size).toBe(3);
            expect(guard.broadcast.size).toBe(3);

            expect(guard.errors[forgedTx.id]).toHaveLength(1);
            expect(guard.errors[forgedTx.id][0].type).toEqual("ERR_FORGED");

            database.getForgedTransactionsIds = getForgedTransactionsIds;
        });
    });

    describe("__addTransactionsToPool", () => {
        it("should add transactions to the pool", () => {
            const transfers = generateTransfers("unitnet", delegates[0].secret, delegates[0].senderPublicKey, 1, 4);

            transfers.forEach(tx => {
                guard.accept.set(tx.id, tx);
                guard.broadcast.set(tx.id, tx);
            });

            expect(guard.errors).toEqual({});

            guard.__addTransactionsToPool();

            expect(guard.errors).toEqual({});
            expect(guard.accept.size).toBe(4);
            expect(guard.broadcast.size).toBe(4);
        });

        it("should raise ERR_ALREADY_IN_POOL when adding existing transactions", () => {
            const transfers = generateTransfers("unitnet", delegates[0].secret, delegates[0].senderPublicKey, 1, 4);

            transfers.forEach(tx => {
                guard.accept.set(tx.id, tx);
                guard.broadcast.set(tx.id, tx);
            });

            expect(guard.errors).toEqual({});

            guard.__addTransactionsToPool();

            expect(guard.errors).toEqual({});
            expect(guard.accept.size).toBe(4);
            expect(guard.broadcast.size).toBe(4);

            // Adding again invokes ERR_ALREADY_IN_POOL
            guard.__addTransactionsToPool();

            expect(guard.accept.size).toBe(0);
            expect(guard.broadcast.size).toBe(0);

            for (const transfer of transfers) {
                expect(guard.errors[transfer.id]).toHaveLength(1);
                expect(guard.errors[transfer.id][0].type).toEqual("ERR_ALREADY_IN_POOL");
            }
        });

        it("should raise ERR_POOL_FULL when attempting to add transactions to a full pool", () => {
            const poolSize = transactionPool.options.maxTransactionsInPool;
            transactionPool.options.maxTransactionsInPool = 3;

            const transfers = generateTransfers("unitnet", delegates[0].secret, delegates[0].senderPublicKey, 1, 4);

            transfers.forEach(tx => {
                guard.accept.set(tx.id, tx);
                guard.broadcast.set(tx.id, tx);
            });

            guard.__addTransactionsToPool();

            expect(guard.accept.size).toBe(3);
            expect(guard.broadcast.size).toBe(4);

            expect(guard.errors[transfers[3].id]).toHaveLength(1);
            expect(guard.errors[transfers[3].id][0].type).toEqual("ERR_POOL_FULL");

            transactionPool.options.maxTransactionsInPool = poolSize;
        });
    });

    describe("__pushError", () => {
        it("should have error for transaction", () => {
            expect(guard.errors).toBeEmpty();

            guard.__pushError({ id: 1 }, "ERR_INVALID", "Invalid.");

            expect(guard.errors).toBeObject();
            expect(guard.errors["1"]).toBeArray();
            expect(guard.errors["1"]).toHaveLength(1);
            expect(guard.errors["1"]).toEqual([{ message: "Invalid.", type: "ERR_INVALID" }]);

            expect(guard.invalid.size).toEqual(1);
            expect(guard.invalid.entries().next().value[1]).toEqual({ id: 1 });
        });

        it("should have multiple errors for transaction", () => {
            expect(guard.errors).toBeEmpty();

            guard.__pushError({ id: 1 }, "ERR_INVALID", "Invalid 1.");
            guard.__pushError({ id: 1 }, "ERR_INVALID", "Invalid 2.");

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
