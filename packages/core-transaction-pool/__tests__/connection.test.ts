/* tslint:disable:max-line-length */
import { app } from "@arkecosystem/core-container";
import { PostgresConnection } from "@arkecosystem/core-database-postgres";
import { fixtures, generators } from "@arkecosystem/core-test-utils";
import { bignumify } from "@arkecosystem/core-utils";
import { constants, models, slots } from "@arkecosystem/crypto";
import delay from "delay";
import randomSeed from "random-seed";
import { TransactionPool } from "../dist";
import { transactions as mockData } from "./__fixtures__/transactions";
import { setUpFull, tearDown } from "./__support__/setup";

const { ARKTOSHI, TransactionTypes } = constants;
const { Transaction } = models;
const { generateTransfers } = generators;
const { delegatesSecrets } = fixtures;

let config;
let database: PostgresConnection;
let connection: TransactionPool;

beforeAll(async () => {
    await setUpFull();

    config = app.getConfig();
    database = app.resolvePlugin<PostgresConnection>("database");
    connection = app.resolvePlugin<TransactionPool>("transactionPool");

    // Ensure no cold wallet and enough funds
    database.walletManager.findByPublicKey("000000000000000000000000000000000000000420000000000000000000000000");
    database.walletManager.findByPublicKey(
        "0310c283aac7b35b4ae6fab201d36e8322c3408331149982e16013a5bcb917081c",
    ).balance = bignumify(200 * 1e8);

    // 100+ years in the future to avoid our hardcoded transactions used in these
    // tests to expire
    connection.options.maxTransactionAge = 4036608000;
});

afterAll(async () => {
    await tearDown();
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
            const senderPublicKey = mockData.dummy1.senderPublicKey;

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
    });

    describe("addTransactions", () => {
        it("should add the transactions to the pool", () => {
            expect(connection.getPoolSize()).toBe(0);

            connection.addTransactions([mockData.dummy1, mockData.dummy2]);

            expect(connection.getPoolSize()).toBe(2);
        });

        it("should not add not-appliable transactions", () => {
            // This should be skipped due to insufficient funds
            const highFeeTransaction = new Transaction(mockData.dummy3);
            highFeeTransaction.fee = bignumify(1e9 * ARKTOSHI);
            // changing public key as fixture transactions have the same one
            highFeeTransaction.senderPublicKey = "000000000000000000000000000000000000000420000000000000000000000000";

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
                `["[PoolWalletManager] Can't apply transaction id:b163572af7598e35b4ea51e92cd1b59c8d653a50fc21358a7690777cc793cc50 from sender:AHkZLLjUdjjjJzNe1zCXqHh27bUhzg8GZw","Insufficient balance in the wallet"]`,
            );
            expect(connection.getPoolSize()).toBe(5);
        });
    });

    describe("addTransactions with expiration", () => {
        it("should add the transactions to the pool and they should expire", async () => {
            expect(connection.getPoolSize()).toBe(0);

            const expireAfterSeconds = 3;
            const expiration = slots.getTime() + expireAfterSeconds;

            const transactions = [];

            transactions.push(new Transaction(mockData.dummyExp1));
            transactions[transactions.length - 1].expiration = expiration;

            transactions.push(new Transaction(mockData.dummy1));
            // transactions[transactions.length - 1].type =
            //   TransactionTypes.TimelockTransfer

            // Workaround: Increase balance of sender wallet to succeed
            const insufficientBalanceTx: any = new Transaction(mockData.dummyExp2);
            transactions.push(insufficientBalanceTx);
            insufficientBalanceTx.expiration = expiration;

            const wallet = connection.walletManager.findByPublicKey(insufficientBalanceTx.senderPublicKey);

            wallet.balance = wallet.balance.plus(insufficientBalanceTx.amount * 2);

            transactions.push(mockData.dummy2);

            // Ensure no cold wallets
            transactions.forEach(tx => database.walletManager.findByPublicKey(tx.senderPublicKey));

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

            connection.removeTransactionsForSender(mockData.dummy1.senderPublicKey);

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
            const exceeded = connection.hasExceededMaxTransactions(mockData.dummy3);
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
            connection.options.allowedSenders = [
                "03d7dfe44e771039334f4712fb95ad355254f674c8f5d286503199157b7bf7c357",
                "ghjk",
            ];
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
    });

    describe("flush", () => {
        it("should flush the pool", () => {
            connection.addTransaction(mockData.dummy1);

            expect(connection.getPoolSize()).toBe(1);

            connection.flush();

            expect(connection.getPoolSize()).toBe(0);
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
            connection.walletManager.findByPublicKey(tx.senderPublicKey).vote = "";

            const voteTx = new Transaction(tx);
            voteTx.id = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
            voteTx.type = TransactionTypes.Vote;
            voteTx.amount = bignumify(0);
            voteTx.asset = { votes: [`+${tx.senderPublicKey}`] };

            const transactions = [tx, voteTx, mockData.dummy2];

            connection.addTransactions(transactions);

            expect(connection.senderHasTransactionsOfType(tx.senderPublicKey, TransactionTypes.Vote)).toBeTrue();
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

            transactions.forEach(t =>
                expect(connection.getTransaction(t.id).serialized.toLowerCase()).toBe(t.serialized.toLowerCase()),
            );

            connection.flush();
        });

        it("remove forged when starting", async () => {
            expect(connection.getPoolSize()).toBe(0);

            const block = await database.getLastBlock();

            // XXX This accesses directly block.transactions which is not even
            // documented in packages/crypto/src/models/block.js
            const forgedTransaction = block.transactions[0];

            // Workaround: Add tx to exceptions so it gets applied, because the fee is 0.
            config.set("exceptions.transactions", [forgedTransaction.id]);

            // For some reason all genesis transactions fail signature verification, so
            // they are not loaded from the local storage and this fails otherwise.
            // TODO: Use jest.spyOn() to change behavior instead. jest.restoreAllMocks() will reset afterwards
            const original = database.getForgedTransactionsIds;
            database.getForgedTransactionsIds = jest.fn(() => [forgedTransaction.id]);

            expect(forgedTransaction instanceof Transaction).toBeTrue();

            const transactions = [mockData.dummy1, forgedTransaction, mockData.dummy4];

            connection.addTransactions(transactions);

            expect(connection.getPoolSize()).toBe(3);

            connection.disconnect();

            await connection.make();

            expect(connection.getPoolSize()).toBe(2);

            transactions.splice(1, 1);

            transactions.forEach(t =>
                expect(connection.getTransaction(t.id).serialized.toLowerCase()).toBe(t.serialized.toLowerCase()),
            );

            connection.flush();

            database.getForgedTransactionsIds = original;
        });
    });

    describe("stress", () => {
        const fakeTransactionId = i => `id${String(i)}aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`;

        it("multiple additions and retrievals", () => {
            // Abstract number which decides how many iterations are run by the test.
            // Increase it to run more iterations.
            const testSize = connection.options.syncInterval * 2;

            for (let i = 0; i < testSize; i++) {
                const transaction = new Transaction(mockData.dummy1);
                transaction.id = fakeTransactionId(i);
                connection.addTransaction(transaction);

                if (i % 27 === 0) {
                    connection.removeTransaction(transaction);
                }
            }

            for (let i = 0; i < testSize * 2; i++) {
                connection.getPoolSize();
                for (const sender of ["nonexistent", mockData.dummy1.senderPublicKey]) {
                    connection.getSenderSize(sender);
                    connection.hasExceededMaxTransactions(sender);
                }
                connection.getTransaction(fakeTransactionId(i));
                connection.getTransactions(0, i);
            }

            for (let i = 0; i < testSize; i++) {
                const transaction = new Transaction(mockData.dummy1);
                transaction.id = fakeTransactionId(i);
                connection.removeTransaction(transaction);
            }
        });

        it("delete + add after sync", () => {
            for (let i = 0; i < connection.options.syncInterval; i++) {
                // tslint:disable-next-line:no-shadowed-variable
                const transaction = new Transaction(mockData.dummy1);
                transaction.id = fakeTransactionId(i);
                connection.addTransaction(transaction);
            }

            const transaction = new Transaction(mockData.dummy1);
            transaction.id = fakeTransactionId(0);
            connection.removeTransaction(transaction);
            connection.addTransaction(transaction);
        });

        it("add many then get first few", () => {
            const nAdd = 2000;

            // We use a predictable random number calculator in order to get
            // a deterministic test.
            const rand = randomSeed.create(0);

            const allTransactions = [];
            for (let i = 0; i < nAdd; i++) {
                const transaction = new Transaction(mockData.dummy1);
                transaction.id = fakeTransactionId(i);
                transaction.fee = bignumify(rand.intBetween(0.002 * ARKTOSHI, 2 * ARKTOSHI));
                transaction.serialized = Transaction.serialize(transaction).toString("hex");
                allTransactions.push(transaction);
            }

            // console.time(`time to add ${nAdd}`)
            connection.addTransactions(allTransactions);
            // console.timeEnd(`time to add ${nAdd}`)

            const nGet = 150;

            const topFeesExpected = allTransactions
                .map(t => t.fee)
                .sort((a, b) => b - a)
                .slice(0, nGet)
                .map(f => f.toString());

            // console.time(`time to get first ${nGet}`)
            const topTransactionsSerialized = connection.getTransactions(0, nGet);
            // console.timeEnd(`time to get first ${nGet}`)

            const topFeesReceived = topTransactionsSerialized.map(e => new Transaction(e).fee.toString());

            expect(topFeesReceived).toEqual(topFeesExpected);
        });
    });

    describe("purgeSendersWithInvalidTransactions", () => {
        it("should purge transactions from sender when invalid", async () => {
            const transfersA = generateTransfers("testnet", delegatesSecrets[0], mockData.dummy1.recipientId, 1, 5);

            const transfersB = generateTransfers("testnet", delegatesSecrets[1], mockData.dummy1.recipientId, 1, 1);

            const block = {
                transactions: [...transfersA, ...transfersB],
            };

            block.transactions.forEach(tx => connection.addTransaction(tx));

            expect(connection.getPoolSize()).toBe(6);

            // Last tx has a unique sender
            block.transactions[5].verified = false;

            connection.purgeSendersWithInvalidTransactions(block);
            expect(connection.getPoolSize()).toBe(5);

            // The remaining tx all have the same sender
            block.transactions[0].verified = false;

            connection.purgeSendersWithInvalidTransactions(block);
            expect(connection.getPoolSize()).toBe(0);
        });
    });

    describe("purgeBlock", () => {
        it("should purge transactions from block", async () => {
            const transactions = generateTransfers("testnet", delegatesSecrets[0], mockData.dummy1.recipientId, 1, 5);
            const block = { transactions };

            block.transactions.forEach(tx => connection.addTransaction(tx));

            expect(connection.getPoolSize()).toBe(5);

            connection.purgeBlock(block);
            expect(connection.getPoolSize()).toBe(0);
        });
    });
});
