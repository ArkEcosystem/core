/* tslint:disable:max-line-length */
import { app } from "@arkecosystem/core-container";
import { Database } from "@arkecosystem/core-interfaces";
import { bignumify } from "@arkecosystem/core-utils";
import { Bignum, constants, models, slots, Transaction } from "@arkecosystem/crypto";
import dayjs from "dayjs-ext";
import delay from "delay";
import cloneDeep from "lodash.clonedeep";
import randomSeed from "random-seed";
import { generators } from "../../core-test-utils";
import { block2, delegates } from "../../core-test-utils/src/fixtures/unitnet";
import { TransactionPool } from "../src/connection";
import { transactions as mockData } from "./__fixtures__/transactions";
import { setUpFull, tearDownFull } from "./__support__/setup";

const { SATOSHI, TransactionTypes } = constants;
const { Block } = models;
const { generateTransfers } = generators;
const delegatesSecrets = delegates.map(d => d.secret);

let config;
let databaseService: Database.IDatabaseService;
let connection: TransactionPool;

beforeAll(async () => {
    await setUpFull();

    config = app.getConfig();
    databaseService = app.resolvePlugin<Database.IDatabaseService>("database");
    connection = app.resolvePlugin<TransactionPool>("transactionPool");

    // Ensure no cold wallet and enough funds
    databaseService.walletManager.findByPublicKey("000000000000000000000000000000000000000420000000000000000000000000");
    databaseService.walletManager.findByPublicKey(
        "0310c283aac7b35b4ae6fab201d36e8322c3408331149982e16013a5bcb917081c",
    ).balance = bignumify(200 * 1e8);

    // 100+ years in the future to avoid our hardcoded transactions used in these
    // tests to expire
    connection.options.maxTransactionAge = 4036608000;
});

afterAll(async () => {
    await tearDownFull();
});

beforeEach(() => {
    connection.flush();
});

describe("Connection", () => {
    describe("getPoolSize", () => {
        it("should return 0 if no transactions were added", () => {
            expect(connection.getPoolSize()).toBe(0);
        });

        it("should return 2 if transactions were added", () => {
            expect(connection.getPoolSize()).toBe(0);

            expect(connection.addTransaction(mockData.dummy1)).toEqual({ success: true });

            expect(connection.getPoolSize()).toBe(1);

            expect(connection.addTransaction(mockData.dummy2)).toEqual({ success: true });

            expect(connection.getPoolSize()).toBe(2);
        });
    });

    describe("getSenderSize", () => {
        it("should return 0 if no transactions were added", () => {
            expect(connection.getSenderSize("undefined")).toBe(0);
        });

        it("should return 2 if transactions were added", () => {
            const senderPublicKey = mockData.dummy1.data.senderPublicKey;

            expect(connection.getSenderSize(senderPublicKey)).toBe(0);

            expect(connection.addTransaction(mockData.dummy1)).toEqual({ success: true });

            expect(connection.getSenderSize(senderPublicKey)).toBe(1);

            expect(connection.addTransaction(mockData.dummy3)).toEqual({ success: true });

            expect(connection.getSenderSize(senderPublicKey)).toBe(2);
        });
    });

    describe("addTransaction", () => {
        it("should add the transaction to the pool", () => {
            expect(connection.getPoolSize()).toBe(0);

            connection.addTransaction(mockData.dummy1);

            // Test adding already existent transaction
            connection.addTransaction(mockData.dummy1);

            expect(connection.getPoolSize()).toBe(1);
        });

        it("should return error when adding 1 more transaction than maxTransactionsInPool", () => {
            expect(connection.getPoolSize()).toBe(0);

            connection.addTransactions([mockData.dummy1, mockData.dummy2, mockData.dummy3, mockData.dummy4]);

            expect(connection.getPoolSize()).toBe(4);

            const maxTransactionsInPoolOrig = connection.options.maxTransactionsInPool;
            connection.options.maxTransactionsInPool = 4;

            expect(connection.addTransaction(mockData.dummy5)).toEqual({
                transaction: mockData.dummy5,
                type: "ERR_POOL_FULL",
                message:
                    `Pool is full (has 4 transactions) and this transaction's fee ` +
                    `${mockData.dummy5.data.fee.toFixed()} is not higher than the lowest fee already in pool 10000000`,
                success: false,
            });

            connection.options.maxTransactionsInPool = maxTransactionsInPoolOrig;
        });

        it("should replace lowest fee transaction when adding 1 more transaction than maxTransactionsInPool", () => {
            expect(connection.getPoolSize()).toBe(0);

            connection.addTransactions([
                mockData.dummy1,
                mockData.dummy2,
                mockData.dummy3,
                mockData.dynamicFeeNormalDummy1,
            ]);

            expect(connection.getPoolSize()).toBe(4);

            const maxTransactionsInPoolOrig = connection.options.maxTransactionsInPool;
            connection.options.maxTransactionsInPool = 4;

            expect(connection.addTransaction(mockData.dummy5)).toEqual({
                success: true,
            });
            expect(connection.getTransactionIdsForForging(0, 10)).toEqual([
                mockData.dummy1.id,
                mockData.dummy2.id,
                mockData.dummy3.id,
                mockData.dummy5.id,
            ]);

            connection.options.maxTransactionsInPool = maxTransactionsInPoolOrig;
        });
    });

    describe("addTransactions", () => {
        it("should add the transactions to the pool", () => {
            expect(connection.getPoolSize()).toBe(0);

            connection.addTransactions([mockData.dummy1, mockData.dummy2]);

            expect(connection.getPoolSize()).toBe(2);
        });

        it("should not add not-appliable transactions", () => {
            // This should be skipped due to insufficient funds
            const highFeeTransaction = Transaction.fromData(cloneDeep(mockData.dummy3.data));
            highFeeTransaction.data.fee = bignumify(1e9 * SATOSHI);
            // changing public key as fixture transactions have the same one
            highFeeTransaction.data.senderPublicKey =
                "000000000000000000000000000000000000000420000000000000000000000000";

            const transactions = [
                mockData.dummy1,
                mockData.dummy2,
                highFeeTransaction,
                mockData.dummy4,
                mockData.dummy5,
                mockData.dummy6,
            ];

            const { added, notAdded } = connection.addTransactions(transactions);
            expect(notAdded[0].message).toEqual(
                `["[PoolWalletManager] Can't apply transaction id:${
                    mockData.dummy3.id
                } from sender:AHkZLLjUdjjjJzNe1zCXqHh27bUhzg8GZw","Insufficient balance in the wallet."]`,
            );
            expect(connection.getPoolSize()).toBe(5);
        });
    });

    describe("addTransactions with expiration", () => {
        it("should add the transactions to the pool and they should expire", async () => {
            expect(connection.getPoolSize()).toBe(0);

            const expireAfterSeconds = 3;
            const expiration = slots.getTime() + expireAfterSeconds;

            const transactions: Transaction[] = [];

            transactions.push(Transaction.fromData(cloneDeep(mockData.dummyExp1.data)));
            transactions[transactions.length - 1].data.expiration = expiration;

            transactions.push(Transaction.fromData(cloneDeep(mockData.dummy1.data)));

            // Workaround: Increase balance of sender wallet to succeed
            const insufficientBalanceTx: any = Transaction.fromData(cloneDeep(mockData.dummyExp2.data));
            transactions.push(insufficientBalanceTx);
            insufficientBalanceTx.data.expiration = expiration;

            transactions.push(mockData.dummy2);

            // Ensure no cold wallets
            transactions.forEach(tx => databaseService.walletManager.findByPublicKey(tx.data.senderPublicKey));

            const { added, notAdded } = connection.addTransactions(transactions);
            expect(added).toHaveLength(4);
            expect(notAdded).toBeEmpty();

            expect(connection.getPoolSize()).toBe(4);
            await delay((expireAfterSeconds + 1) * 1000);
            expect(connection.getPoolSize()).toBe(2);

            transactions.forEach(t => connection.removeTransactionById(t.id));
        });
    });

    describe("removeTransaction", () => {
        it("should remove the specified transaction from the pool", () => {
            connection.addTransaction(mockData.dummy1);

            expect(connection.getPoolSize()).toBe(1);

            connection.removeTransaction(mockData.dummy1);

            expect(connection.getPoolSize()).toBe(0);
        });
    });

    describe("removeTransactionById", () => {
        it("should remove the specified transaction from the pool (by id)", () => {
            connection.addTransaction(mockData.dummy1);

            expect(connection.getPoolSize()).toBe(1);

            connection.removeTransactionById(mockData.dummy1.id);

            expect(connection.getPoolSize()).toBe(0);
        });

        it("should do nothing when asked to delete a non-existent transaction", () => {
            connection.addTransaction(mockData.dummy1);

            connection.removeTransactionById("nonexistenttransactionid");

            expect(connection.getPoolSize()).toBe(1);
        });
    });

    describe("removeTransactionsForSender", () => {
        it("should remove the senders transactions from the pool", () => {
            connection.addTransaction(mockData.dummy1);
            connection.addTransaction(mockData.dummy3);
            connection.addTransaction(mockData.dummy4);
            connection.addTransaction(mockData.dummy5);
            connection.addTransaction(mockData.dummy6);
            connection.addTransaction(mockData.dummy10);

            expect(connection.getPoolSize()).toBe(6);

            connection.removeTransactionsForSender(mockData.dummy1.data.senderPublicKey);

            expect(connection.getPoolSize()).toBe(1);
        });
    });

    describe("transactionExists", () => {
        it("should return true if transaction is IN pool", () => {
            connection.addTransactions([mockData.dummy1, mockData.dummy2]);

            expect(connection.transactionExists(mockData.dummy1.id)).toBeTrue();
            expect(connection.transactionExists(mockData.dummy2.id)).toBeTrue();
        });

        it("should return false if transaction is NOT pool", () => {
            expect(connection.transactionExists(mockData.dummy1.id)).toBeFalse();
            expect(connection.transactionExists(mockData.dummy2.id)).toBeFalse();
        });
    });

    describe("hasExceededMaxTransactions", () => {
        it("should be true if exceeded", () => {
            connection.options.maxTransactionsPerSender = 5;
            connection.options.allowedSenders = [];
            connection.addTransaction(mockData.dummy3);
            connection.addTransaction(mockData.dummy4);
            connection.addTransaction(mockData.dummy5);
            connection.addTransaction(mockData.dummy6);
            connection.addTransaction(mockData.dummy7);
            connection.addTransaction(mockData.dummy8);
            connection.addTransaction(mockData.dummy9);

            expect(connection.getPoolSize()).toBe(7);
            const exceeded = connection.hasExceededMaxTransactions(mockData.dummy3.data);
            expect(exceeded).toBeTrue();
        });

        it("should be falsy if not exceeded", () => {
            connection.options.maxTransactionsPerSender = 7;
            connection.options.allowedSenders = [];

            connection.addTransaction(mockData.dummy4);
            connection.addTransaction(mockData.dummy5);
            connection.addTransaction(mockData.dummy6);

            expect(connection.getPoolSize()).toBe(3);
            const exceeded = connection.hasExceededMaxTransactions(mockData.dummy3);
            expect(exceeded).toBeFalse();
        });

        it("should be allowed to exceed if whitelisted", () => {
            connection.flush();
            connection.options.maxTransactionsPerSender = 5;
            connection.options.allowedSenders = [delegates[0].publicKey, delegates[1].publicKey];
            connection.addTransaction(mockData.dummy3);
            connection.addTransaction(mockData.dummy4);
            connection.addTransaction(mockData.dummy5);
            connection.addTransaction(mockData.dummy6);
            connection.addTransaction(mockData.dummy7);
            connection.addTransaction(mockData.dummy8);
            connection.addTransaction(mockData.dummy9);

            expect(connection.getPoolSize()).toBe(7);
            const exceeded = connection.hasExceededMaxTransactions(mockData.dummy3);
            expect(exceeded).toBeFalse();
        });
    });

    describe("getTransaction", () => {
        it("should return the specified transaction", () => {
            connection.addTransaction(mockData.dummy1);

            const poolTransaction = connection.getTransaction(mockData.dummy1.id);
            expect(poolTransaction).toBeObject();
            expect(poolTransaction.id).toBe(mockData.dummy1.id);
        });

        it("should return undefined for nonexisting transaction", () => {
            const poolTransaction = connection.getTransaction("non existing id");
            expect(poolTransaction).toBeFalsy();
        });
    });

    describe("getTransactions", () => {
        it("should return transactions within the specified range", () => {
            const transactions = [mockData.dummy1, mockData.dummy2];

            connection.addTransactions(transactions);

            if (transactions[1].fee > transactions[0].fee) {
                transactions.reverse();
            }

            for (const i of [0, 1]) {
                const retrieved = connection
                    .getTransactions(i, 1)
                    .map(serializedTx => Transaction.fromBytes(serializedTx));

                expect(retrieved.length).toBe(1);
                expect(retrieved[0]).toBeObject();
                expect(retrieved[0].id).toBe(transactions[i].id);
            }
        });
    });

    describe("getTransactionIdsForForging", () => {
        it("should return an array of transactions ids", () => {
            connection.addTransaction(mockData.dummy1);
            connection.addTransaction(mockData.dummy2);
            connection.addTransaction(mockData.dummy3);
            connection.addTransaction(mockData.dummy4);
            connection.addTransaction(mockData.dummy5);
            connection.addTransaction(mockData.dummy6);

            const transactionIds = connection.getTransactionIdsForForging(0, 6);

            expect(transactionIds).toBeArray();
            expect(transactionIds[0]).toBe(mockData.dummy1.id);
            expect(transactionIds[1]).toBe(mockData.dummy2.id);
            expect(transactionIds[2]).toBe(mockData.dummy3.id);
            expect(transactionIds[3]).toBe(mockData.dummy4.id);
            expect(transactionIds[4]).toBe(mockData.dummy5.id);
            expect(transactionIds[5]).toBe(mockData.dummy6.id);
        });

        it("should only return transaction ids for transactions not exceeding the maximum payload size", () => {
            mockData.dummyLarge1.data.signatures = mockData.dummyLarge2.data.signatures = [""];
            for (let i = 0; i < connection.options.maxTransactionBytes * 0.6; i++) {
                mockData.dummyLarge1.data.signatures += "1";
                mockData.dummyLarge2.data.signatures += "2";
            }

            const transactions = [
                mockData.dummyLarge1,
                mockData.dummyLarge2,
                mockData.dummy3,
                mockData.dummy4,
                mockData.dummy5,
                mockData.dummy6,
                mockData.dummy7,
            ];

            // Add exception for oversized transactions with extra signatures data
            config.set("exceptions.transactions", [mockData.dummyLarge1.id, mockData.dummyLarge2.id]);

            connection.addTransactions(transactions);

            let transactionIds = connection.getTransactionIdsForForging(0, 7);
            expect(transactionIds).toBeArray();
            expect(transactionIds.length).toBe(6);
            expect(transactionIds[0]).toBe(mockData.dummyLarge1.id);
            expect(transactionIds[1]).toBe(mockData.dummy3.id);
            expect(transactionIds[2]).toBe(mockData.dummy4.id);
            expect(transactionIds[3]).toBe(mockData.dummy5.id);
            expect(transactionIds[4]).toBe(mockData.dummy6.id);
            expect(transactionIds[5]).toBe(mockData.dummy7.id);

            connection.removeTransactionById(mockData.dummyLarge1.id);
            connection.removeTransactionById(mockData.dummy3.id);
            connection.removeTransactionById(mockData.dummy4.id);
            connection.removeTransactionById(mockData.dummy5.id);
            connection.removeTransactionById(mockData.dummy6.id);
            connection.removeTransactionById(mockData.dummy7.id);

            transactionIds = connection.getTransactionIdsForForging(0, 7);
            expect(transactionIds).toBeArray();
            expect(transactionIds.length).toBe(1);
            expect(transactionIds[0]).toBe(mockData.dummyLarge2.id);
        });
    });

    describe("getTransactionsForForging", () => {
        it("should return an array of transactions serialized", () => {
            const transactions = [mockData.dummy1, mockData.dummy2, mockData.dummy3, mockData.dummy4];
            connection.addTransactions(transactions);

            const transactionsForForging = connection.getTransactionsForForging(4);

            expect(transactionsForForging).toEqual(transactions.map(tx => tx.serialized.toString("hex")));
        });
        it("should only return transactions not exceeding the maximum payload size", () => {
            mockData.dummyLarge1.data.signatures = mockData.dummyLarge2.data.signatures = [""];
            for (let i = 0; i < connection.options.maxTransactionBytes * 0.6; i++) {
                mockData.dummyLarge1.data.signatures += "1";
                mockData.dummyLarge2.data.signatures += "2";
            }

            const transactions = [
                mockData.dummyLarge1,
                mockData.dummyLarge2,
                mockData.dummy3,
                mockData.dummy4,
                mockData.dummy5,
                mockData.dummy6,
                mockData.dummy7,
            ];

            // Add exception for oversized transactions with extra signatures data
            config.set("exceptions.transactions", [mockData.dummyLarge1.id, mockData.dummyLarge2.id]);

            connection.addTransactions(transactions);

            let transactionsForForging = connection.getTransactionsForForging(7);

            expect(transactionsForForging.length).toBe(6);
            expect(transactionsForForging[0]).toEqual(mockData.dummyLarge1.serialized.toString("hex"));
            expect(transactionsForForging[1]).toEqual(mockData.dummy3.serialized.toString("hex"));
            expect(transactionsForForging[2]).toEqual(mockData.dummy4.serialized.toString("hex"));
            expect(transactionsForForging[3]).toEqual(mockData.dummy5.serialized.toString("hex"));
            expect(transactionsForForging[4]).toEqual(mockData.dummy6.serialized.toString("hex"));
            expect(transactionsForForging[5]).toEqual(mockData.dummy7.serialized.toString("hex"));

            connection.removeTransactionById(mockData.dummyLarge1.id);
            connection.removeTransactionById(mockData.dummy3.id);
            connection.removeTransactionById(mockData.dummy4.id);
            connection.removeTransactionById(mockData.dummy5.id);
            connection.removeTransactionById(mockData.dummy6.id);
            connection.removeTransactionById(mockData.dummy7.id);

            transactionsForForging = connection.getTransactionsForForging(7);
            expect(transactionsForForging.length).toBe(1);
            expect(transactionsForForging[0]).toEqual(mockData.dummyLarge2.serialized.toString("hex"));
        });
    });

    describe("flush", () => {
        it("should flush the pool", () => {
            connection.addTransaction(mockData.dummy1);

            expect(connection.getPoolSize()).toBe(1);

            connection.flush();

            expect(connection.getPoolSize()).toBe(0);
        });
    });

    describe("isSenderBlocked", () => {
        it("should return false if sender is not blocked", () => {
            const publicKey = "thisPublicKeyIsNotBlocked";
            expect(connection.isSenderBlocked(publicKey)).toBeFalse();
        });

        it("should return true if sender is blocked", () => {
            const publicKey = "thisPublicKeyIsBlocked";
            (connection as any).blockedByPublicKey[publicKey] = dayjs().add(1, "hour");
            expect(connection.isSenderBlocked(publicKey)).toBeTrue();
        });

        it("should return false and remove blockedByPublicKey[senderPublicKey] when sender is not blocked anymore", async () => {
            const publicKey = "thisPublicKeyIsNotBlockedAnymore";
            (connection as any).blockedByPublicKey[publicKey] = dayjs().add(1, "second");
            await delay(1100);
            expect(connection.isSenderBlocked(publicKey)).toBeFalse();
            expect((connection as any).blockedByPublicKey[publicKey]).toBeUndefined();
        });
    });

    describe("blockSender", () => {
        it("should block sender for 1 hour", () => {
            const publicKey = "publicKeyToBlock";
            const plus1HourBefore = dayjs().add(1, "hour");

            const blockReleaseTime = connection.blockSender(publicKey);

            const plus1HourAfter = dayjs().add(1, "hour");
            expect((connection as any).blockedByPublicKey[publicKey]).toBe(blockReleaseTime);
            expect(blockReleaseTime >= plus1HourBefore).toBeTrue();
            expect(blockReleaseTime <= plus1HourAfter).toBeTrue();
        });
    });

    describe("acceptChainedBlock", () => {
        beforeEach(() => connection.walletManager.reset());
        afterEach(() => connection.walletManager.reset());

        it("should update wallet when accepting a chained block", () => {
            const senderRecipientWallet = connection.walletManager.findByAddress(block2.transactions[0].recipientId);
            const balanceBefore = senderRecipientWallet.balance;

            connection.acceptChainedBlock(new Block(block2));

            expect(+senderRecipientWallet.balance).toBe(+balanceBefore.minus(block2.totalFee));
        });

        it("should remove transaction from pool if it's in the chained block", () => {
            const transaction0 = Transaction.fromData(cloneDeep(block2.transactions[0]));
            connection.addTransaction(transaction0);

            expect(connection.getTransactions(0, 10)).toEqual([transaction0.serialized]);

            connection.acceptChainedBlock(new Block(block2));

            expect(connection.getTransactions(0, 10)).toEqual([]);
        });

        it("should purge and block sender if canApply() failed for a transaction in the chained block", () => {
            const senderRecipientWallet = connection.walletManager.findByAddress(block2.transactions[0].recipientId);
            senderRecipientWallet.balance = new Bignum(10); // not enough funds for transactions in block

            expect(connection.walletManager.allByAddress()).toEqual([senderRecipientWallet]);

            // canApply should fail because wallet has not enough funds
            connection.acceptChainedBlock(new Block(block2));

            expect(connection.walletManager.allByAddress()).toEqual([]);
            expect(connection.isSenderBlocked(block2.transactions[0].senderPublicKey)).toBeTrue();
        });

        it("should delete wallet of transaction sender if its balance is down to zero", () => {
            const senderRecipientWallet = connection.walletManager.findByAddress(block2.transactions[0].recipientId);
            senderRecipientWallet.balance = new Bignum(block2.totalFee); // exactly enough funds for transactions in block

            expect(connection.walletManager.allByAddress()).toEqual([senderRecipientWallet]);

            connection.acceptChainedBlock(new Block(block2));

            expect(connection.walletManager.allByAddress()).toEqual([]);
        });
    });

    describe("buildWallets", () => {
        beforeEach(() => connection.walletManager.reset());
        afterEach(() => connection.walletManager.reset());

        it("should build wallets from transactions in the pool", async () => {
            const transaction0 = Transaction.fromData(cloneDeep(block2.transactions[0]));
            connection.addTransaction(transaction0);

            expect(connection.getTransactions(0, 10)).toEqual([transaction0.serialized]);

            connection.walletManager.reset();

            expect(connection.walletManager.allByAddress()).toEqual([]);

            await connection.buildWallets();

            const allWallets = connection.walletManager.allByAddress();
            expect(allWallets).toHaveLength(1);
            expect(allWallets[0].publicKey).toBe(transaction0.data.senderPublicKey);
        });

        it("should handle getTransaction() not finding transaction", async () => {
            const transaction0 = Transaction.fromData(cloneDeep(block2.transactions[0]));
            connection.addTransaction(transaction0);

            expect(connection.getTransactions(0, 10)).toEqual([transaction0.serialized]);

            connection.walletManager.reset();

            expect(connection.walletManager.allByAddress()).toEqual([]);

            jest.spyOn(connection, "getTransaction").mockImplementationOnce(id => undefined);

            await connection.buildWallets();

            expect(connection.walletManager.allByAddress()).toEqual([]);
        });

        it("should not apply transaction to wallet if canApply() failed", async () => {
            const transaction0 = Transaction.fromData(cloneDeep(block2.transactions[0]));
            connection.addTransaction(transaction0);
            expect(connection.getTransactions(0, 10)).toEqual([transaction0.serialized]);

            connection.walletManager.reset();
            expect(connection.walletManager.allByAddress()).toEqual([]);

            const senderRecipientWallet = connection.walletManager.findByAddress(block2.transactions[0].recipientId);
            senderRecipientWallet.balance = new Bignum(10); // not enough funds for transactions in block

            jest.spyOn(connection.walletManager, "findByPublicKey").mockImplementationOnce(
                publicKey => senderRecipientWallet,
            );

            await connection.buildWallets();

            expect(connection.walletManager.allByAddress()).toEqual([]); // canApply() failed, wallet was purged
        });
    });

    describe("senderHasTransactionsOfType", () => {
        it("should be false for non-existent sender", () => {
            connection.addTransaction(mockData.dummy1);

            expect(connection.senderHasTransactionsOfType("nonexistent", TransactionTypes.Vote)).toBeFalse();
        });

        it("should be false for existent sender with no votes", () => {
            const tx = mockData.dummy1;

            connection.addTransaction(tx);

            expect(connection.senderHasTransactionsOfType(tx.senderPublicKey, TransactionTypes.Vote)).toBeFalse();
        });

        it("should be true for existent sender with votes", () => {
            const tx = mockData.dummy1;

            // Prevent 'wallet has already voted' error
            connection.walletManager.findByPublicKey(tx.data.senderPublicKey).vote = "";

            const voteTx = Transaction.fromData(cloneDeep(tx.data));
            voteTx.data.id = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
            voteTx.data.type = TransactionTypes.Vote;
            voteTx.data.amount = bignumify(0);
            voteTx.data.asset = { votes: [`+${tx.data.senderPublicKey}`] };

            const transactions = [tx, voteTx, mockData.dummy2];

            connection.addTransactions(transactions);

            expect(connection.senderHasTransactionsOfType(tx.data.senderPublicKey, TransactionTypes.Vote)).toBeTrue();
        });
    });

    describe("shutdown and start", () => {
        it("save and restore transactions", () => {
            expect(connection.getPoolSize()).toBe(0);

            const transactions = [mockData.dummy1, mockData.dummy4];

            connection.addTransactions(transactions);

            expect(connection.getPoolSize()).toBe(2);

            connection.disconnect();

            connection.make();

            expect(connection.getPoolSize()).toBe(2);

            transactions.forEach(t => expect(connection.getTransaction(t.id).serialized).toEqual(t.serialized));

            connection.flush();
        });

        it("remove forged when starting", async () => {
            expect(connection.getPoolSize()).toBe(0);

            const block = await databaseService.getLastBlock();

            // XXX This accesses directly block.transactions which is not even
            // documented in packages/crypto/src/models/block.js
            const forgedTransaction = block.transactions[0];

            // Workaround: Add tx to exceptions so it gets applied, because the fee is 0.
            config.set("exceptions.transactions", [forgedTransaction.id]);

            // For some reason all genesis transactions fail signature verification, so
            // they are not loaded from the local storage and this fails otherwise.
            // TODO: Use jest.spyOn() to change behavior instead. jest.restoreAllMocks() will reset afterwards
            const original = databaseService.getForgedTransactionsIds;
            // @ts-ignore
            databaseService.getForgedTransactionsIds = jest.fn(() => [forgedTransaction.id]);

            expect(forgedTransaction instanceof Transaction).toBeTrue();

            const transactions = [mockData.dummy1, forgedTransaction, mockData.dummy4];

            connection.addTransactions(transactions);

            expect(connection.getPoolSize()).toBe(3);

            connection.disconnect();

            await connection.make();

            expect(connection.getPoolSize()).toBe(2);

            transactions.splice(1, 1);

            transactions.forEach(t => expect(connection.getTransaction(t.id).serialized).toEqual(t.serialized));

            connection.flush();

            databaseService.getForgedTransactionsIds = original;
        });
    });

    describe("stress", () => {
        const fakeTransactionId = i => `${String(i)}${"a".repeat(64 - String(i).length)}`;

        it("multiple additions and retrievals", () => {
            // Abstract number which decides how many iterations are run by the test.
            // Increase it to run more iterations.
            const testSize = connection.options.syncInterval * 2;

            const usedId = {};
            for (let i = 0; i < testSize; i++) {
                const transaction = Transaction.fromData(cloneDeep(mockData.dummy1.data));
                transaction.data.id = fakeTransactionId(i);
                if (usedId[transaction.data.id]) {
                    console.log("AAAAA");
                } else {
                    usedId[transaction.data.id] = true;
                }

                connection.addTransaction(transaction);

                if (i % 27 === 0) {
                    connection.removeTransaction(transaction);
                }
            }

            for (let i = 0; i < testSize * 2; i++) {
                connection.getPoolSize();
                for (const sender of ["nonexistent", mockData.dummy1.data.senderPublicKey]) {
                    connection.getSenderSize(sender);
                    connection.hasExceededMaxTransactions(sender);
                }
                connection.getTransaction(fakeTransactionId(i));
                connection.getTransactions(0, i);
            }

            for (let i = 0; i < testSize; i++) {
                const transaction = Transaction.fromData(cloneDeep(mockData.dummy1.data));
                transaction.data.id = fakeTransactionId(i);
                connection.removeTransaction(transaction);
            }
        });

        it("delete + add after sync", () => {
            for (let i = 0; i < connection.options.syncInterval; i++) {
                // tslint:disable-next-line:no-shadowed-variable
                const transaction = Transaction.fromData(cloneDeep(mockData.dummy1.data));
                transaction.data.id = fakeTransactionId(i);
                connection.addTransaction(transaction);
            }

            const transaction = Transaction.fromData(cloneDeep(mockData.dummy1.data));
            transaction.data.id = fakeTransactionId(0);
            connection.removeTransaction(transaction);
            connection.addTransaction(transaction);
        });

        it("add many then get first few", () => {
            const nAdd = 2000;

            // We use a predictable random number calculator in order to get
            // a deterministic test.
            const rand = randomSeed.create("0");

            const allTransactions: Transaction[] = [];
            for (let i = 0; i < nAdd; i++) {
                const transaction = Transaction.fromData(cloneDeep(mockData.dummy1.data));
                transaction.data.id = fakeTransactionId(i);
                transaction.data.fee = bignumify(rand.intBetween(0.002 * SATOSHI, 2 * SATOSHI));
                transaction.serialized = Transaction.toBytes(transaction.data);
                allTransactions.push(transaction);
            }

            // console.time(`time to add ${nAdd}`)
            connection.addTransactions(allTransactions);
            // console.timeEnd(`time to add ${nAdd}`)

            const nGet = 150;

            const topFeesExpected = allTransactions
                .map(t => t.data.fee as any)
                .sort((a, b) => b - a)
                .slice(0, nGet)
                .map(f => f.toString());

            // console.time(`time to get first ${nGet}`)
            const topTransactionsSerialized = connection.getTransactions(0, nGet);
            // console.timeEnd(`time to get first ${nGet}`)

            const topFeesReceived = topTransactionsSerialized.map(e => Transaction.fromBytes(e).data.fee.toString());

            expect(topFeesReceived).toEqual(topFeesExpected);
        });
    });

    describe("purgeSendersWithInvalidTransactions", () => {
        it("should purge transactions from sender when invalid", async () => {
            const transfersA = generateTransfers(
                "unitnet",
                delegatesSecrets[0],
                mockData.dummy1.data.recipientId,
                1,
                5,
            );

            const transfersB = generateTransfers(
                "unitnet",
                delegatesSecrets[1],
                mockData.dummy1.data.recipientId,
                1,
                1,
            );

            const block = {
                transactions: [...transfersA, ...transfersB],
            } as any;

            block.transactions.forEach(tx => connection.addTransaction(tx));

            expect(connection.getPoolSize()).toBe(6);

            // Last tx has a unique sender
            block.transactions[5].isVerified = false;

            connection.purgeSendersWithInvalidTransactions(block);
            expect(connection.getPoolSize()).toBe(5);

            // The remaining tx all have the same sender
            block.transactions[0].isVerified = false;

            connection.purgeSendersWithInvalidTransactions(block);
            expect(connection.getPoolSize()).toBe(0);
        });
    });

    describe("purgeBlock", () => {
        it("should purge transactions from block", async () => {
            const transactions = generateTransfers(
                "unitnet",
                delegatesSecrets[0],
                mockData.dummy1.data.recipientId,
                1,
                5,
            );
            const block = { transactions } as models.Block;

            block.transactions.forEach(tx => connection.addTransaction(tx));

            expect(connection.getPoolSize()).toBe(5);

            connection.purgeBlock(block);
            expect(connection.getPoolSize()).toBe(0);
        });
    });

    describe("driver", () => {
        it("should get the driver instance", async () => {
            expect(connection.driver()).toBe(connection.driver);
        });
    });
});
