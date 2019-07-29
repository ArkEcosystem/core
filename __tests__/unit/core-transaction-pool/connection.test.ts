import "jest-extended";

import { container } from "./mocks/core-container";
import { state } from "./mocks/state";

import { State } from "@arkecosystem/core-interfaces";
import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import {
    Blocks,
    Constants,
    Crypto,
    Enums,
    Identities,
    Interfaces,
    Managers,
    Transactions,
    Utils,
} from "@arkecosystem/crypto";
import assert from "assert";
import delay from "delay";
import cloneDeep from "lodash.clonedeep";
import shuffle from "lodash.shuffle";
import randomSeed from "random-seed";
import { Connection } from "../../../packages/core-transaction-pool/src/connection";
import { defaults } from "../../../packages/core-transaction-pool/src/defaults";
import { Memory } from "../../../packages/core-transaction-pool/src/memory";
import { Storage } from "../../../packages/core-transaction-pool/src/storage";
import { WalletManager } from "../../../packages/core-transaction-pool/src/wallet-manager";
import { TransactionFactory } from "../../helpers/transaction-factory";
import { block2, delegates } from "../../utils/fixtures/unitnet";
import { transactions as mockData } from "./__fixtures__/transactions";
import { database as databaseService } from "./mocks/database";

const { BlockFactory } = Blocks;
const { SATOSHI } = Constants;
const { TransactionTypes } = Enums;

const delegatesSecrets = delegates.map(d => d.secret);

const maxTransactionAge: number = 2700;
let connection: Connection;
let memory: Memory;

const indexWalletWithSufficientBalance = (transaction: Interfaces.ITransaction): void => {
    // @ts-ignore
    const walletManager = connection.databaseService.walletManager;

    const wallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
    wallet.balance = wallet.balance.plus(transaction.data.amount.plus(transaction.data.fee));
    walletManager.reindex(wallet);
};

const updateSenderNonce = (transaction: Interfaces.ITransaction) => {
    (connection as any).databaseService.walletManager.findByPublicKey(
        transaction.data.senderPublicKey,
    ).nonce = Utils.BigNumber.make(transaction.data.nonce).minus(1);
};

beforeAll(async () => {
    memory = new Memory(maxTransactionAge);

    connection = new Connection({
        options: defaults,
        walletManager: new WalletManager(),
        memory,
        storage: new Storage(),
    });

    // @ts-ignore
    connection.databaseService.walletManager = new Wallets.WalletManager();

    for (const transaction of Object.values(mockData)) {
        indexWalletWithSufficientBalance(transaction);
    }

    await connection.make();
});

beforeEach(() => connection.flush());

describe("Connection", () => {
    const addTransactions = transactions => {
        for (const t of transactions) {
            memory.remember(t);
        }
    };

    describe("getPoolSize", () => {
        it("should return 0 if no transactions were added", () => {
            expect(connection.getPoolSize()).toBe(0);
        });

        it("should return 2 if transactions were added", () => {
            expect(connection.getPoolSize()).toBe(0);

            memory.remember(mockData.dummy1);

            expect(connection.getPoolSize()).toBe(1);

            memory.remember(mockData.dummy2);

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

            memory.remember(mockData.dummy1);

            expect(connection.getSenderSize(senderPublicKey)).toBe(1);

            memory.remember(mockData.dummy3);

            expect(connection.getSenderSize(senderPublicKey)).toBe(2);
        });
    });

    // @TODO: remove this test or move it to "addTransactions" as it is not part of the public API
    describe.skip("addTransaction", () => {
        beforeAll(() => {
            const mockWallet = new Wallets.Wallet(delegates[0].address);
            jest.spyOn(connection.walletManager, "findByPublicKey").mockReturnValue(mockWallet);
            jest.spyOn(connection.walletManager, "throwIfCannotBeApplied").mockReturnValue();
        });
        afterAll(() => {
            jest.restoreAllMocks();
        });

        it("should add the transaction to the pool", () => {
            expect(connection.getPoolSize()).toBe(0);

            connection.addTransactions([mockData.dummy1]);

            // Test adding already existent transaction
            connection.addTransactions([mockData.dummy1]);

            expect(connection.getPoolSize()).toBe(1);
        });

        it("should return error when adding 1 more transaction than maxTransactionsInPool", () => {
            expect(connection.getPoolSize()).toBe(0);

            connection.addTransactions([mockData.dummy1, mockData.dummy2, mockData.dummy3, mockData.dummy4]);

            expect(connection.getPoolSize()).toBe(4);

            const maxTransactionsInPoolOrig = connection.options.maxTransactionsInPool;
            connection.options.maxTransactionsInPool = 4;

            expect(connection.addTransactions([mockData.dummy5])).toEqual({
                transaction: mockData.dummy5,
                type: "ERR_POOL_FULL",
                message:
                    `Pool is full (has 4 transactions) and this transaction's fee ` +
                    `${mockData.dummy5.data.fee} is not higher than the lowest fee already in pool 10000000`,
            });

            connection.options.maxTransactionsInPool = maxTransactionsInPoolOrig;
        });

        it("should replace lowest fee transaction when adding 1 more transaction than maxTransactionsInPool", async () => {
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

            expect(connection.addTransactions([mockData.dummy5])).toEqual({});

            const transactionIds = await connection.getTransactionIdsForForging(0, 10);
            expect(transactionIds).toEqual([
                mockData.dummy1.id,
                mockData.dummy2.id,
                mockData.dummy3.id,
                mockData.dummy5.id,
            ]);

            connection.options.maxTransactionsInPool = maxTransactionsInPoolOrig;
        });

        it.skip("should raise ERR_ALREADY_IN_POOL when adding existing transactions", () => {
            // TODO
        });
    });

    describe("addTransactions", () => {
        let mockWallet: Wallets.Wallet;

        beforeAll(() => {
            mockWallet = new Wallets.Wallet(delegates[0].address);

            connection.walletManager.reindex(mockWallet);
            jest.spyOn(connection.walletManager, "throwIfCannotBeApplied").mockReturnValue();
        });
        afterAll(() => {
            jest.restoreAllMocks();
        });

        it("should add the transactions to the pool", () => {
            expect(connection.getPoolSize()).toBe(0);

            const wallet = new Wallets.Wallet(Identities.Address.fromPublicKey(mockData.dummy1.data.senderPublicKey));
            wallet.balance = Utils.BigNumber.make(1e12);
            connection.walletManager.reindex(wallet);

            connection.addTransactions([mockData.dummy1, mockData.dummy2]);

            expect(connection.getPoolSize()).toBe(2);
        });

        it("should not add not-appliable transactions", () => {
            // This should be skipped due to insufficient funds
            const highFeeTransaction = Transactions.TransactionFactory.fromData(cloneDeep(mockData.dummy3.data));
            highFeeTransaction.data.fee = Utils.BigNumber.make(1e9 * SATOSHI);
            // changing public key as fixture transactions have the same one
            highFeeTransaction.data.senderPublicKey =
                "000000000000000000000000000000000000000420000000000000000000000000";

            jest.spyOn(connection.walletManager, "throwIfCannotBeApplied").mockImplementation(tx => {
                throw new Error(JSON.stringify(["Some error in throwIfCannotBeApplied"]));
            });
            const { notAdded } = connection.addTransactions([highFeeTransaction]);
            expect(notAdded[0]).toEqual({
                message: '["Some error in throwIfCannotBeApplied"]',
                transaction: highFeeTransaction,
                type: "ERR_APPLY",
            });
            expect(connection.getPoolSize()).toBe(0);
        });
    });

    describe("addTransactions with expiration", () => {
        beforeAll(() => {
            jest.spyOn(connection.walletManager, "throwIfCannotBeApplied").mockReturnValue();
            connection.walletManager.reset();
        });
        afterAll(() => {
            jest.restoreAllMocks();
        });

        it.each([1, 2])("should correctly expire transactions (v%i)", async transactionVersion => {
            const setHeight = height => {
                jest.spyOn(state, "getStore").mockReturnValue({
                    ...state.getStore(),
                    ...{ getLastHeight: () => height },
                });
                jest.spyOn(Crypto.Slots, "getTime").mockReturnValue(
                    height * Managers.configManager.getMilestone(height).blocktime,
                );
            };

            jest.spyOn(container.app, "has").mockReturnValue(true);

            const heightAtStart = 42;

            setHeight(heightAtStart);

            expect(connection.getPoolSize()).toBe(0);

            const expireAfterBlocks: number = 3;
            const expiration: number = heightAtStart + expireAfterBlocks;

            const transactions: Interfaces.ITransaction[] = [];

            let nonce: Utils.BigNumber = (connection as any).databaseService.walletManager.findByPublicKey(
                mockData.dummy1.data.senderPublicKey,
            ).nonce;

            for (const [i, exp] of [0, expiration, expiration + 5].entries()) {
                transactions.push(
                    TransactionFactory.transfer(mockData.dummy1.data.recipientId)
                        .withNetwork("unitnet")
                        .withPassphrase(delegatesSecrets[0])
                        .withFee(SATOSHI + i)
                        .withNonce(nonce)
                        .withVersion(transactionVersion)
                        .withExpiration(exp)
                        .build(1)[0],
                );
                nonce = nonce.plus(1);
            }

            const { added, notAdded } = connection.addTransactions(transactions);

            expect(notAdded).toBeEmpty();
            expect(added).toHaveLength(3);

            expect(connection.getPoolSize()).toBe(3);

            setHeight(expiration - 1);

            expect(connection.getPoolSize()).toBe(3);

            setHeight(expiration);

            switch (transactionVersion) {
                case 1:
                    expect(connection.getPoolSize()).toBe(3);
                    break;
                case 2:
                    expect(connection.getPoolSize()).toBe(1);
                    break;
            }

            setHeight(heightAtStart + maxTransactionAge);

            switch (transactionVersion) {
                case 1:
                    expect(connection.getPoolSize()).toBe(0);
                    break;
                case 2:
                    expect(connection.getPoolSize()).toBe(1); // v2 transactions do not expire
                    break;
            }

            for (const t of transactions) {
                connection.removeTransactionById(t.id);
            }
        });
    });

    describe("removeTransaction", () => {
        it("should remove the specified transaction from the pool", () => {
            memory.remember(mockData.dummy1);

            expect(connection.getPoolSize()).toBe(1);

            connection.removeTransaction(mockData.dummy1);

            expect(connection.getPoolSize()).toBe(0);
        });
    });

    describe("removeTransactionById", () => {
        it("should remove the specified transaction from the pool (by id)", () => {
            memory.remember(mockData.dummy1);

            expect(connection.getPoolSize()).toBe(1);

            connection.removeTransactionById(mockData.dummy1.id);

            expect(connection.getPoolSize()).toBe(0);
        });

        it("should do nothing when asked to delete a non-existent transaction", () => {
            memory.remember(mockData.dummy1);

            connection.removeTransactionById("nonexistenttransactionid");

            expect(connection.getPoolSize()).toBe(1);
        });
    });

    describe("removeTransactionsForSender", () => {
        it("should remove the senders transactions from the pool", () => {
            addTransactions([
                mockData.dummy1,
                mockData.dummy3,
                mockData.dummy4,
                mockData.dummy5,
                mockData.dummy6,
                mockData.dummy10,
            ]);

            expect(connection.getPoolSize()).toBe(6);

            connection.removeTransactionsForSender(mockData.dummy1.data.senderPublicKey);

            expect(connection.getPoolSize()).toBe(1);
        });
    });

    describe("has", () => {
        it("should return true if transaction is IN pool", () => {
            addTransactions([mockData.dummy1, mockData.dummy2]);

            expect(connection.has(mockData.dummy1.id)).toBeTrue();
            expect(connection.has(mockData.dummy2.id)).toBeTrue();
        });

        it("should return false if transaction is NOT pool", () => {
            expect(connection.has(mockData.dummy1.id)).toBeFalse();
            expect(connection.has(mockData.dummy2.id)).toBeFalse();
        });
    });

    describe("hasExceededMaxTransactions", () => {
        it("should be true if exceeded", () => {
            connection.options.maxTransactionsPerSender = 5;
            connection.options.allowedSenders = [];
            addTransactions([
                mockData.dummy3,
                mockData.dummy4,
                mockData.dummy5,
                mockData.dummy6,
                mockData.dummy7,
                mockData.dummy8,
                mockData.dummy9,
            ]);

            expect(connection.getPoolSize()).toBe(7);
            const exceeded = connection.hasExceededMaxTransactions(mockData.dummy3.data.senderPublicKey);
            expect(exceeded).toBeTrue();
        });

        it("should be falsy if not exceeded", () => {
            connection.options.maxTransactionsPerSender = 7;
            connection.options.allowedSenders = [];

            addTransactions([mockData.dummy4, mockData.dummy5, mockData.dummy6]);

            expect(connection.getPoolSize()).toBe(3);
            const exceeded = connection.hasExceededMaxTransactions(mockData.dummy3.data.senderPublicKey);
            expect(exceeded).toBeFalse();
        });

        it("should be allowed to exceed if whitelisted", () => {
            connection.flush();
            connection.options.maxTransactionsPerSender = 5;
            connection.options.allowedSenders = [delegates[0].publicKey, delegates[1].publicKey];
            addTransactions([
                mockData.dummy3,
                mockData.dummy4,
                mockData.dummy5,
                mockData.dummy6,
                mockData.dummy7,
                mockData.dummy8,
                mockData.dummy9,
            ]);

            expect(connection.getPoolSize()).toBe(7);
            const exceeded = connection.hasExceededMaxTransactions(mockData.dummy3.data.senderPublicKey);
            expect(exceeded).toBeFalse();
        });
    });

    describe("getTransaction", () => {
        it("should return the specified transaction", () => {
            addTransactions([mockData.dummy1]);

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
        it("should return transactions within the specified range", async () => {
            const transactions = [mockData.dummy1, mockData.dummyLarge1];

            addTransactions(transactions);
            updateSenderNonce(mockData.dummyLarge1);

            if (transactions[1].data.fee > transactions[0].data.fee) {
                transactions.reverse();
            }

            for (const i of [0, 1]) {
                const retrieved = (await connection.getTransactions(i, 1)).map(serializedTx =>
                    Transactions.TransactionFactory.fromBytes(serializedTx),
                );

                expect(retrieved.length).toBe(1);
                expect(retrieved[0]).toBeObject();
                expect(retrieved[0].id).toBe(transactions[i].id);
            }
        });
    });

    describe("getTransactionIdsForForging", () => {
        it("should return an array of transactions ids", async () => {
            addTransactions([
                mockData.dummy1,
                mockData.dummy2,
                mockData.dummy3,
                mockData.dummy4,
                mockData.dummy5,
                mockData.dummy6,
            ]);

            const transactionIds = await connection.getTransactionIdsForForging(0, 6);

            expect(transactionIds).toBeArray();
            expect(transactionIds[0]).toBe(mockData.dummy1.id);
            expect(transactionIds[1]).toBe(mockData.dummy2.id);
            expect(transactionIds[2]).toBe(mockData.dummy3.id);
            expect(transactionIds[3]).toBe(mockData.dummy4.id);
            expect(transactionIds[4]).toBe(mockData.dummy5.id);
            expect(transactionIds[5]).toBe(mockData.dummy6.id);
        });

        it("should only return transaction ids for transactions not exceeding the maximum payload size", async () => {
            const transactions = TransactionFactory.transfer().build(5);

            const largeTransactions = TransactionFactory.transfer()
                .withPassphrase(delegatesSecrets[22])
                .build(2);

            for (const transaction of transactions) {
                indexWalletWithSufficientBalance(transaction);
            }

            for (const transaction of largeTransactions) {
                indexWalletWithSufficientBalance(transaction);
            }

            // @FIXME: Uhm excuse me, what the?
            largeTransactions[0].data.signatures = largeTransactions[1].data.signatures = [""];
            for (let i = 0; i < connection.options.maxTransactionBytes * 0.6; i++) {
                // @ts-ignore
                largeTransactions[0].data.signatures += "1";
                // @ts-ignore
                largeTransactions[1].data.signatures += "2";
            }

            addTransactions([...transactions, ...largeTransactions]);

            let transactionIds = await connection.getTransactionIdsForForging(0, 7);
            expect(transactionIds).toBeArray();
            expect(transactionIds).toHaveLength(5);
            expect(transactionIds[0]).toBe(transactions[0].id);
            expect(transactionIds[1]).toBe(transactions[1].id);
            expect(transactionIds[2]).toBe(transactions[2].id);
            expect(transactionIds[3]).toBe(transactions[3].id);
            expect(transactionIds[4]).toBe(transactions[4].id);

            connection.removeTransactionById(transactions[0].id);
            connection.removeTransactionById(transactions[1].id);
            connection.removeTransactionById(transactions[2].id);
            connection.removeTransactionById(transactions[3].id);
            connection.removeTransactionById(transactions[4].id);

            transactionIds = await connection.getTransactionIdsForForging(0, 7);
            expect(transactionIds).toBeArray();
            expect(transactionIds).toHaveLength(0);
        });
    });

    describe("getTransactionsForForging", () => {
        afterEach(() => {
            jest.restoreAllMocks();
        });
        it("should return an array of transactions serialized", async () => {
            const transactions = [mockData.dummy1, mockData.dummy2, mockData.dummy3, mockData.dummy4];
            addTransactions(transactions);

            const spy = jest.spyOn(Handlers.Registry.get(0), "throwIfCannotBeApplied").mockReturnValue();
            const transactionsForForging = await connection.getTransactionsForForging(4);
            spy.mockRestore();

            expect(transactionsForForging).toEqual(transactions.map(tx => tx.serialized.toString("hex")));
        });

        it("should only return unforged transactions", async () => {
            const transactions = [mockData.dummy1, mockData.dummy2, mockData.dummyLarge1];

            updateSenderNonce(mockData.dummyLarge1);

            addTransactions(transactions);

            jest.spyOn(databaseService, "getForgedTransactionsIds").mockReturnValue([
                mockData.dummy1.id,
                mockData.dummy2.id,
            ]);
            jest.spyOn(Handlers.Registry.get(0), "throwIfCannotBeApplied").mockReturnValue();

            const transactionsForForging = await connection.getTransactionsForForging(3);
            expect(transactionsForForging.length).toBe(1);
            expect(transactionsForForging[0]).toEqual(mockData.dummyLarge1.serialized.toString("hex"));
        });

        it("should only return transactions not exceeding the maximum payload size", async () => {
            const transactions = TransactionFactory.transfer().build(5);

            const largeTransactions = TransactionFactory.transfer()
                .withPassphrase(delegatesSecrets[22])
                .build(2);

            for (const transaction of transactions) {
                indexWalletWithSufficientBalance(transaction);
            }

            for (const transaction of largeTransactions) {
                indexWalletWithSufficientBalance(transaction);
            }

            // @FIXME: Uhm excuse me, what the?
            largeTransactions[0].data.signatures = largeTransactions[1].data.signatures = [""];
            for (let i = 0; i < connection.options.maxTransactionBytes * 0.6; i++) {
                // @ts-ignore
                largeTransactions[0].data.signatures += "1";
                // @ts-ignore
                largeTransactions[1].data.signatures += "2";
            }

            addTransactions([...transactions, ...largeTransactions]);

            jest.spyOn(Handlers.Registry.get(0), "throwIfCannotBeApplied").mockReturnValue();
            let transactionsForForging = await connection.getTransactionsForForging(7);

            expect(transactionsForForging.length).toBe(6);
            expect(transactionsForForging[0]).toEqual(transactions[0].serialized.toString("hex"));
            expect(transactionsForForging[1]).toEqual(transactions[1].serialized.toString("hex"));
            expect(transactionsForForging[2]).toEqual(transactions[2].serialized.toString("hex"));
            expect(transactionsForForging[3]).toEqual(transactions[3].serialized.toString("hex"));
            expect(transactionsForForging[4]).toEqual(transactions[4].serialized.toString("hex"));
            expect(transactionsForForging[5]).toEqual(largeTransactions[0].serialized.toString("hex"));

            connection.removeTransactionById(largeTransactions[0].id);
            connection.removeTransactionById(transactions[0].id);
            connection.removeTransactionById(transactions[1].id);
            connection.removeTransactionById(transactions[2].id);
            connection.removeTransactionById(transactions[3].id);
            connection.removeTransactionById(transactions[4].id);

            updateSenderNonce(largeTransactions[1]);

            transactionsForForging = await connection.getTransactionsForForging(7);

            expect(transactionsForForging.length).toBe(1);
            expect(transactionsForForging[0]).toEqual(largeTransactions[1].serialized.toString("hex"));
        });
    });

    describe("flush", () => {
        it("should flush the pool", () => {
            addTransactions([mockData.dummy1]);

            expect(connection.getPoolSize()).toBe(1);

            connection.flush();

            expect(connection.getPoolSize()).toBe(0);
        });
    });

    describe("acceptChainedBlock", () => {
        let mockWallet;
        beforeEach(() => {
            const transactionHandler = Handlers.Registry.get(TransactionTypes.Transfer);
            jest.spyOn(transactionHandler, "throwIfCannotBeApplied").mockReturnValue();

            mockWallet = new Wallets.Wallet(block2.transactions[0].recipientId);
            mockWallet.balance = Utils.BigNumber.make(1e12);
            jest.spyOn(connection.walletManager, "hasByAddress").mockReturnValue(true);
            jest.spyOn(connection.walletManager, "hasByPublicKey").mockReturnValue(true);
            jest.spyOn(connection.walletManager, "findByPublicKey").mockImplementation(publicKey => {
                if (publicKey === block2.generatorPublicKey) {
                    return new Wallets.Wallet("thisIsTheDelegateGeneratorAddress0");
                }
                return mockWallet;
            });
            jest.spyOn(connection.walletManager, "findByAddress").mockReturnValue(mockWallet);
        });
        afterEach(() => {
            jest.restoreAllMocks();
        });

        it("should update wallet when accepting a chained block", () => {
            const balanceBefore = mockWallet.balance;
            connection.acceptChainedBlock(BlockFactory.fromData(block2));

            expect(+mockWallet.balance).toBe(+balanceBefore.minus(block2.totalFee));
        });

        it("should remove transaction from pool if it's in the chained block", async () => {
            updateSenderNonce(mockData.dummy2);

            addTransactions([mockData.dummy2]);

            let transactions = await connection.getTransactions(0, 10);
            expect(transactions).toEqual([mockData.dummy2.serialized]);

            mockWallet.nonce = Utils.BigNumber.make(block2.numberOfTransactions + 1);

            const chainedBlock = BlockFactory.fromData(block2);
            chainedBlock.transactions.push(mockData.dummy2);

            connection.acceptChainedBlock(chainedBlock);

            transactions = await connection.getTransactions(0, 10);
            expect(transactions).toEqual([]);
        });

        it("should forget sender if throwIfApplyingFails() failed for a transaction in the chained block", () => {
            const transactionHandler = Handlers.Registry.get(TransactionTypes.Transfer);
            jest.spyOn(transactionHandler, "throwIfCannotBeApplied").mockImplementation(() => {
                throw new Error("test error");
            });

            const { senderPublicKey } = block2.transactions[0];
            const forget = jest.spyOn(connection.walletManager, "forget");
            const applyToSender = jest.spyOn(transactionHandler, "applyToSender");

            // WORKAROUND: nonce is decremented when added so it can't be 0 else it hits the assert.
            mockWallet.nonce = Utils.BigNumber.make(block2.numberOfTransactions + 1);
            connection.acceptChainedBlock(BlockFactory.fromData(block2));

            expect(connection.walletManager.hasByIndex(State.WalletIndexes.PublicKeys, senderPublicKey)).toBeFalse();
            expect(applyToSender).not.toHaveBeenCalled();
            expect(forget).toHaveBeenCalledTimes(block2.transactions.length);
        });

        it("should delete wallet of transaction sender if its balance is down to zero", () => {
            jest.spyOn(connection.walletManager, "canBePurged").mockReturnValue(true);
            const forget = jest.spyOn(connection.walletManager, "forget");

            // WORKAROUND: nonce is decremented when added so it can't be 0 else it hits the assert.
            mockWallet.nonce = Utils.BigNumber.make(block2.numberOfTransactions + 1);
            connection.acceptChainedBlock(BlockFactory.fromData(block2));

            expect(forget).toHaveBeenCalledTimes(block2.transactions.length);
        });
    });

    describe("buildWallets", () => {
        let findByPublicKey;
        let throwIfCannotBeApplied;
        let applyToSender;
        const findByPublicKeyWallet = new Wallets.Wallet("ANwc3YQe3EBjuE5sNRacP7fhkngAPaBW4Y");
        findByPublicKeyWallet.publicKey = "02778aa3d5b332965ea2a5ef6ac479ce2478535bc681a098dff1d683ff6eccc417";

        beforeEach(() => {
            const transactionHandler = Handlers.Registry.get(TransactionTypes.Transfer);
            throwIfCannotBeApplied = jest.spyOn(transactionHandler, "throwIfCannotBeApplied").mockReturnValue();
            applyToSender = jest.spyOn(transactionHandler, "applyToSender").mockReturnValue();

            (connection as any).databaseService.walletManager.findByPublicKey(
                mockData.dummy1.data.senderPublicKey,
            ).balance = Utils.BigNumber.ZERO;

            jest.spyOn(connection.walletManager, "has").mockReturnValue(true);
            findByPublicKey = jest
                .spyOn(connection.walletManager, "findByPublicKey")
                .mockReturnValue(findByPublicKeyWallet as any);
            jest.spyOn(connection.walletManager, "findByAddress").mockReturnValue(new Wallets.Wallet(
                "nowThisIsAnotherCoolAddressIMadeUp",
            ) as any);
        });
        afterEach(() => {
            jest.restoreAllMocks();
        });

        it("should build wallets from transactions in the pool", async () => {
            addTransactions([mockData.dummy1]);

            const transactions = await connection.getTransactions(0, 10);
            expect(transactions).toEqual([mockData.dummy1.serialized]);

            await connection.buildWallets();

            expect(findByPublicKey).toHaveBeenCalledWith(mockData.dummy1.data.senderPublicKey);
            expect(throwIfCannotBeApplied).toHaveBeenCalledWith(
                mockData.dummy1,
                findByPublicKeyWallet,
                (connection as any).databaseService.walletManager,
            );
            expect(applyToSender).toHaveBeenCalledWith(mockData.dummy1, connection.walletManager);
        });

        it("should handle getTransaction() not finding transaction", async () => {
            const getTransaction = jest.spyOn(connection, "getTransaction").mockImplementationOnce(id => undefined);

            addTransactions([mockData.dummy1]);
            await connection.buildWallets();

            expect(getTransaction).toHaveBeenCalled();
            expect(findByPublicKey).not.toHaveBeenCalled();
            expect(throwIfCannotBeApplied).toHaveBeenCalled();
            expect(applyToSender).toHaveBeenCalled();
        });

        it("should not apply transaction to wallet if throwIfCannotBeApplied() failed", async () => {
            const transactionHandler = Handlers.Registry.get(TransactionTypes.Transfer);
            throwIfCannotBeApplied = jest.spyOn(transactionHandler, "throwIfCannotBeApplied").mockImplementation(() => {
                throw new Error("throw from test");
            });
            const purgeByPublicKey = jest.spyOn(connection, "purgeByPublicKey").mockReturnValue();

            updateSenderNonce(mockData.dummy1);
            addTransactions([mockData.dummy1]);

            await connection.buildWallets();

            expect(applyToSender).not.toHaveBeenCalled();
            expect(throwIfCannotBeApplied).toHaveBeenCalledWith(
                mockData.dummy1,
                findByPublicKeyWallet,
                (connection as any).databaseService.walletManager,
            );
            expect(purgeByPublicKey).not.toHaveBeenCalledWith(mockData.dummy1.data.senderPublicKey);
        });
    });

    describe("senderHasTransactionsOfType", () => {
        it("should be false for non-existent sender", () => {
            addTransactions([mockData.dummy1]);

            expect(connection.senderHasTransactionsOfType("nonexistent", TransactionTypes.Vote)).toBeFalse();
        });

        it("should be false for existent sender with no votes", () => {
            addTransactions([mockData.dummy1]);

            expect(
                connection.senderHasTransactionsOfType(mockData.dummy1.data.senderPublicKey, TransactionTypes.Vote),
            ).toBeFalse();
        });

        it("should be true for existent sender with votes", () => {
            const tx = mockData.dummy1;

            const voteTx = Transactions.TransactionFactory.fromData(cloneDeep(tx.data));
            voteTx.data.id = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
            voteTx.data.type = TransactionTypes.Vote;
            voteTx.data.amount = Utils.BigNumber.ZERO;
            voteTx.data.asset = { votes: [`+${tx.data.senderPublicKey}`] };

            const transactions = [tx, voteTx, mockData.dummy2];

            addTransactions(transactions);

            expect(connection.senderHasTransactionsOfType(tx.data.senderPublicKey, TransactionTypes.Vote)).toBeTrue();
        });
    });

    describe("shutdown and start", () => {
        it("save and restore transactions", async () => {
            expect(connection.getPoolSize()).toBe(0);

            indexWalletWithSufficientBalance(mockData.dummy1);
            indexWalletWithSufficientBalance(mockData.dummyLarge1);

            const transactions = [mockData.dummy1, mockData.dummyLarge1];

            addTransactions(transactions);

            expect(connection.getPoolSize()).toBe(2);

            connection.disconnect();

            await connection.make();

            container.app.resolvePlugin("event-emitter").emit("internal.stateBuilder.finished");

            await delay(200);

            expect(connection.getPoolSize()).toBe(2);

            for (const t of transactions) {
                expect(connection.getTransaction(t.id).serialized).toEqual(t.serialized);
            }

            connection.flush();
        });

        it("remove forged when starting", async () => {
            expect(connection.getPoolSize()).toBe(0);

            jest.spyOn(databaseService, "getForgedTransactionsIds").mockReturnValue([mockData.dummy2.id]);

            indexWalletWithSufficientBalance(mockData.dummy1);
            indexWalletWithSufficientBalance(mockData.dummy2);
            indexWalletWithSufficientBalance(mockData.dummy4);

            updateSenderNonce(mockData.dummy1);
            updateSenderNonce(mockData.dummyLarge1);

            const transactions = [mockData.dummy1, mockData.dummy2, mockData.dummyLarge1];

            addTransactions(transactions);

            expect(connection.getPoolSize()).toBe(3);

            connection.disconnect();

            await connection.make();

            container.app.resolvePlugin("event-emitter").emit("internal.stateBuilder.finished");

            await delay(200);

            expect(connection.getPoolSize()).toBe(2);

            transactions.splice(1, 1);

            for (const t of transactions) {
                expect(connection.getTransaction(t.id).serialized).toEqual(t.serialized);
            }

            connection.flush();

            jest.restoreAllMocks();
        });
    });

    describe("stress", () => {
        beforeAll(() => {
            jest.spyOn(connection.walletManager, "throwIfCannotBeApplied").mockReturnValue();
        });

        beforeEach(() => {
            connection.walletManager.reset();
        });

        afterAll(() => {
            jest.restoreAllMocks();
        });

        const generateTestTransactions = (n: number, nDifferentSenders?: number): Interfaces.ITransaction[] => {
            if (nDifferentSenders === undefined) {
                nDifferentSenders = n;
            }

            // We use a predictable random number calculator in order to get
            // a deterministic test.
            const rand = randomSeed.create("0");

            const testTransactions: Interfaces.ITransaction[] = [];
            for (let i = 0; i < n; i++) {
                const passphrase = String(i % nDifferentSenders);

                const transaction = TransactionFactory.transfer("AFzQCx5YpGg5vKMBg4xbuYbqkhvMkKfKe5", i + 1)
                    .withNetwork("unitnet")
                    .withPassphrase(passphrase)
                    .withFee(rand.intBetween(0.002 * SATOSHI, 2 * SATOSHI))
                    .build()[0];
                testTransactions.push(transaction);

                const wallet = new Wallets.Wallet(Identities.Address.fromPassphrase(passphrase));
                wallet.balance = Utils.BigNumber.make(1e14);

                connection.walletManager.reindex(wallet);
            }

            return testTransactions;
        };

        it("multiple additions and retrievals", async () => {
            // Abstract number which decides how many iterations are run by the test.
            // Increase it to run more iterations.
            const testSize = connection.options.syncInterval * 2;

            const testTransactions: Interfaces.ITransaction[] = generateTestTransactions(testSize);

            // console.time("multiple additions and retrievals");

            for (let i = 0; i < testSize; i++) {
                const transaction = testTransactions[i];

                connection.addTransactions([transaction]);

                if (i % 27 === 0) {
                    connection.removeTransaction(transaction);
                }
            }

            for (let i = 0; i < testSize * 2; i++) {
                const transaction = testTransactions[i % testSize];
                connection.getPoolSize();
                for (const senderPublicKey of ["nonexistent", transaction.data.senderPublicKey]) {
                    connection.getSenderSize(senderPublicKey);
                    connection.hasExceededMaxTransactions(senderPublicKey);
                }
                connection.getTransaction(transaction.id);
                await connection.getTransactions(0, i);
            }

            for (let i = 0; i < testSize; i++) {
                connection.removeTransaction(testTransactions[i]);
            }

            // console.timeEnd("multiple additions and retrievals");
        });

        it("delete + add after sync", () => {
            const testTransactions: Interfaces.ITransaction[] = generateTestTransactions(
                connection.options.syncInterval,
            );

            connection.addTransactions(testTransactions);

            connection.removeTransaction(testTransactions[0]);
            connection.addTransactions([testTransactions[0]]);
        });

        it("add many then get first few", async () => {
            const nAdd = 2000;

            // We use a predictable random number calculator in order to get
            // a deterministic test.
            const rand = randomSeed.create("0");

            const testTransactions: Interfaces.ITransaction[] = [];
            for (let i = 0; i < nAdd; i++) {
                const transaction = TransactionFactory.transfer("AFzQCx5YpGg5vKMBg4xbuYbqkhvMkKfKe5")
                    .withNetwork("unitnet")
                    .withFee(rand.intBetween(0.002 * SATOSHI, 2 * SATOSHI))
                    .withPassphrase(String(i))
                    .build()[0];

                testTransactions.push(transaction);

                indexWalletWithSufficientBalance(transaction);
            }

            // console.time(`time to add ${nAdd}`)
            connection.addTransactions(testTransactions);
            // console.timeEnd(`time to add ${nAdd}`)

            const nGet = 150;

            const topFeesExpected = testTransactions
                .map(t => t.data.fee as any)
                .sort((a, b) => b - a)
                .slice(0, nGet)
                .map(f => f.toString());

            // console.time(`time to get first ${nGet}`)
            const topTransactionsSerialized = await connection.getTransactions(0, nGet);
            // console.timeEnd(`time to get first ${nGet}`)

            const topFeesReceived = topTransactionsSerialized.map(e =>
                Transactions.TransactionFactory.fromBytes(e).data.fee.toString(),
            );

            expect(topFeesReceived).toEqual(topFeesExpected);
        });

        // TODO: @vd connection.getTransactions(...) doesn't return sorted by nonce
        it.skip("sort by fee, nonce", async () => {
            const nTransactions = 1000;
            const nDifferentSenders = 100;

            jest.spyOn(assert, "strictEqual").mockReturnValue();

            // Non-randomized nonces, used for each sender. Make sure there are enough
            // elements in this array, so that each transaction of a given sender gets
            // an unique nonce for that sender.
            const nonces = [];
            for (let i = 0; i < Math.ceil(nTransactions / nDifferentSenders); i++) {
                nonces.push(Utils.BigNumber.make(i + 1));
            }

            const testTransactions: Interfaces.ITransaction[] = generateTestTransactions(
                nTransactions,
                nDifferentSenders,
            );

            const noncesBySender = {};

            for (const t of testTransactions) {
                const sender = t.data.senderPublicKey;

                if (noncesBySender[sender] === undefined) {
                    noncesBySender[sender] = shuffle(nonces);
                }

                t.data.nonce = noncesBySender[sender].shift();

                t.serialized = Transactions.Utils.toBytes(t.data);
                indexWalletWithSufficientBalance(t);
            }

            // const timerLabelAdd = `time to add ${testTransactions.length} transactions`;
            // console.time(timerLabelAdd);
            for (const t of testTransactions) {
                memory.remember(t);
            }
            // console.timeEnd(timerLabelAdd);

            // const timerLabelSort = `time to sort ${testTransactions.length} transactions`;
            // console.time(timerLabelSort);
            const sortedTransactionsSerialized = await connection.getTransactions(0, nTransactions);
            // console.timeEnd(timerLabelSort);

            const sortedTransactions = sortedTransactionsSerialized.map(serialized =>
                Transactions.TransactionFactory.fromBytes(serialized),
            );

            expect(sortedTransactions.length).toEqual(testTransactions.length);

            const firstTransaction = sortedTransactions[0];

            const lastNonceBySender = {};
            lastNonceBySender[firstTransaction.data.senderPublicKey] = firstTransaction.data.nonce;

            for (let i = 1; i < sortedTransactions.length; i++) {
                const prevTransaction = sortedTransactions[i - 1];
                const prevSender = prevTransaction.data.senderPublicKey;

                const curTransaction = sortedTransactions[i];
                const curSender = curTransaction.data.senderPublicKey;

                if (prevTransaction.data.fee.isLessThan(curTransaction.data.fee)) {
                    expect(prevSender).toEqual(curSender);
                }

                if (prevSender !== curSender) {
                    let j;
                    for (j = i - 2; j >= 0 && sortedTransactions[j].data.senderPublicKey === prevSender; j--) {
                        // Find the leftmost transaction in a sequence of transactions from the same
                        // sender, ending at prevTransaction. That leftmost transaction's fee must
                        // be greater or equal to the fee of curTransaction.
                    }
                    j++;
                    expect(sortedTransactions[j].data.fee.isGreaterThanOrEqualTo(curTransaction.data.fee)).toBeTrue();
                }

                if (lastNonceBySender[curSender] !== undefined) {
                    expect(lastNonceBySender[curSender].isLessThan(curTransaction.data.nonce)).toBeTrue();
                }

                lastNonceBySender[curSender] = curTransaction.data.nonce;
            }

            jest.restoreAllMocks();
        });
    });

    describe("purgeInvalidTransactions", () => {
        it("should flush the pool", () => {
            // 64 char vendor field
            Managers.configManager.setHeight(1);

            addTransactions([
                TransactionFactory.transfer("AabMvWPVKbdTHRcGBpATq9TEMiMD5xeJh9", 2 * 1e8, "#".repeat(64))
                    .withNetwork("unitnet")
                    .withPassphrase(delegates[1].passphrase)
                    .build()[0],
            ]);

            expect(connection.getPoolSize()).toBe(1);

            connection.purgeInvalidTransactions();

            expect(connection.getPoolSize()).toBe(1);

            // 255 char vendor field
            Managers.configManager.setHeight(100000);

            addTransactions([
                TransactionFactory.transfer("AabMvWPVKbdTHRcGBpATq9TEMiMD5xeJh9", 2 * 1e8, "#".repeat(255))
                    .withNetwork("unitnet")
                    .withPassphrase(delegates[1].passphrase)
                    .build()[0],
            ]);

            connection.purgeInvalidTransactions();

            expect(connection.getPoolSize()).toBe(2);

            // Invalidate transactions with a vendor field longer then 64 chars
            Managers.configManager.setHeight(1);

            jest.spyOn(connection.walletManager, "revertTransactionForSender").mockReturnValueOnce();

            connection.purgeInvalidTransactions();

            expect(connection.getPoolSize()).toBe(1);
        });
    });
});
