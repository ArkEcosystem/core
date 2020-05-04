import "jest-extended";

import { container } from "./mocks/core-container";
import { state } from "./mocks/state";

import { ApplicationEvents } from "@arkecosystem/core-event-emitter";
import { State } from "@arkecosystem/core-interfaces";
import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { Constants, Crypto, Enums, Identities, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { BigNumber } from "@arkecosystem/crypto/src/utils";
import assert from "assert";
import delay from "delay";
import cloneDeep from "lodash.clonedeep";
import shuffle from "lodash.shuffle";
import randomSeed from "random-seed";
import { Connection } from "../../../packages/core-transaction-pool/src/connection";
import { defaults } from "../../../packages/core-transaction-pool/src/defaults";
import { Memory } from "../../../packages/core-transaction-pool/src/memory";
import { Storage } from "../../../packages/core-transaction-pool/src/storage";
import { getMaxTransactionBytes } from "../../../packages/core-transaction-pool/src/utils";
import { WalletManager } from "../../../packages/core-transaction-pool/src/wallet-manager";
import { BlockFactory, TransactionFactory } from "../../helpers";
import { delegates } from "../../utils/fixtures/unitnet";
import { transactions as mockData } from "./__fixtures__/transactions";
import { database as databaseService } from "./mocks/database";

const { SATOSHI } = Constants;
const { TransactionType } = Enums;

const delegatesSecrets = delegates.map(d => d.secret);

const maxTransactionAge: number = 2700;
let connection: Connection;
let memory: Memory;

const indexWalletWithSufficientBalance = (transaction: Interfaces.ITransaction): void => {
    // @ts-ignore
    const walletManager = connection.databaseService.walletManager;

    const wallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
    wallet.balance = wallet.balance.plus(transaction.data.amount.plus(transaction.data.fee));
    if (transaction.type === Enums.TransactionType.MultiPayment) {
        wallet.balance = wallet.balance.plus(
            transaction.data.asset.payments.reduce((acc, curr) => acc.plus(curr.amount), BigNumber.ZERO),
        );
    }
    walletManager.reindex(wallet);
};

const updateSenderNonce = (transaction: Interfaces.ITransaction) => {
    (connection as any).databaseService.walletManager.findByPublicKey(
        transaction.data.senderPublicKey,
    ).nonce = Utils.BigNumber.make(transaction.data.nonce).minus(1);
};

beforeAll(async () => {
    memory = new Memory(maxTransactionAge);

    container.app.resolvePlugin("database").walletManager = new Wallets.WalletManager();

    connection = new Connection({
        options: defaults,
        walletManager: new WalletManager(),
        memory,
        storage: new Storage(),
    });

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
        it("should return 0 if no transactions were added", async () => {
            await expect(connection.getPoolSize()).resolves.toBe(0);
        });

        it("should return 2 if transactions were added", async () => {
            await expect(connection.getPoolSize()).resolves.toBe(0);

            memory.remember(mockData.dummy1);

            await expect(connection.getPoolSize()).resolves.toBe(1);

            memory.remember(mockData.dummy2);

            await expect(connection.getPoolSize()).resolves.toBe(2);
        });
    });

    describe("getSenderSize", () => {
        it("should return 0 if no transactions were added", async () => {
            expect(await connection.getSenderSize("undefined")).toBe(0);
        });

        it("should return 2 if transactions were added", async () => {
            const senderPublicKey = mockData.dummy1.data.senderPublicKey;

            expect(await connection.getSenderSize(senderPublicKey)).toBe(0);

            memory.remember(mockData.dummy1);

            expect(await connection.getSenderSize(senderPublicKey)).toBe(1);

            memory.remember(mockData.dummy3);

            expect(await connection.getSenderSize(senderPublicKey)).toBe(2);
        });
    });

    // @TODO: remove this test or move it to "addTransactions" as it is not part of the public API
    describe.skip("addTransaction", () => {
        beforeAll(() => {
            const mockWallet = new Wallets.Wallet(delegates[0].address);
            jest.spyOn(connection.walletManager, "findByPublicKey").mockReturnValue(mockWallet);
            jest.spyOn(connection.walletManager, "throwIfCannotBeApplied").mockReturnValue(undefined);
        });
        afterAll(() => {
            jest.restoreAllMocks();
        });

        it("should add the transaction to the pool", async () => {
            await expect(connection.getPoolSize()).resolves.toBe(0);

            await connection.addTransactions([mockData.dummy1]);

            // Test adding already existent transaction
            await connection.addTransactions([mockData.dummy1]);

            await expect(connection.getPoolSize()).resolves.toBe(1);
        });

        it("should return error when adding 1 more transaction than maxTransactionsInPool", async () => {
            await expect(connection.getPoolSize()).resolves.toBe(0);

            await connection.addTransactions([mockData.dummy1, mockData.dummy2, mockData.dummy3, mockData.dummy4]);

            await expect(connection.getPoolSize()).resolves.toBe(4);

            const maxTransactionsInPoolOrig = connection.options.maxTransactionsInPool;
            connection.options.maxTransactionsInPool = 4;

            await expect(connection.addTransactions([mockData.dummy5])).toEqual({
                transaction: mockData.dummy5,
                type: "ERR_POOL_FULL",
                message:
                    `Pool is full (has 4 transactions) and this transaction's fee ` +
                    `${mockData.dummy5.data.fee} is not higher than the lowest fee already in pool 10000000`,
            });

            connection.options.maxTransactionsInPool = maxTransactionsInPoolOrig;
        });

        it("should replace lowest fee transaction when adding 1 more transaction than maxTransactionsInPool", async () => {
            await expect(connection.getPoolSize()).resolves.toBe(0);

            await connection.addTransactions([
                mockData.dummy1,
                mockData.dummy2,
                mockData.dummy3,
                mockData.dynamicFeeNormalDummy1,
            ]);

            await expect(connection.getPoolSize()).resolves.toBe(4);

            const maxTransactionsInPoolOrig = connection.options.maxTransactionsInPool;
            connection.options.maxTransactionsInPool = 4;

            expect(await connection.addTransactions([mockData.dummy5])).toEqual({});

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
            jest.spyOn(connection.walletManager, "throwIfCannotBeApplied").mockResolvedValue(undefined);
        });
        afterAll(() => {
            jest.restoreAllMocks();
        });

        it("should add the transactions to the pool", async () => {
            await expect(connection.getPoolSize()).resolves.toBe(0);

            const wallet = new Wallets.Wallet(Identities.Address.fromPublicKey(mockData.dummy1.data.senderPublicKey));
            wallet.balance = Utils.BigNumber.make(1e12);
            connection.walletManager.reindex(wallet);

            await connection.addTransactions([mockData.dummy1, mockData.dummy2]);

            await expect(connection.getPoolSize()).resolves.toBe(2);
        });

        it("should not add not-appliable transactions", async () => {
            // This should be skipped due to insufficient funds
            const highFeeTransaction = Transactions.TransactionFactory.fromData(cloneDeep(mockData.dummy3.data));
            highFeeTransaction.data.fee = Utils.BigNumber.make(1e9 * SATOSHI);
            // changing public key as fixture transactions have the same one
            highFeeTransaction.data.senderPublicKey =
                "000000000000000000000000000000000000000420000000000000000000000000";

            jest.spyOn(connection.walletManager, "throwIfCannotBeApplied").mockImplementation(tx => {
                throw new Error(JSON.stringify(["Some error in throwIfCannotBeApplied"]));
            });
            const { notAdded } = await connection.addTransactions([highFeeTransaction]);
            expect(notAdded[0]).toEqual({
                message: '["Some error in throwIfCannotBeApplied"]',
                transaction: highFeeTransaction,
                type: "ERR_APPLY",
            });
            await expect(connection.getPoolSize()).resolves.toBe(0);
        });
    });

    describe("addTransactions with expiration", () => {
        beforeAll(() => {
            jest.spyOn(connection.walletManager, "throwIfCannotBeApplied").mockResolvedValue(undefined);
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

            await expect(connection.getPoolSize()).resolves.toBe(0);

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

            const { added, notAdded } = await connection.addTransactions(transactions);

            expect(notAdded).toBeEmpty();
            expect(added).toHaveLength(3);

            await expect(connection.getPoolSize()).resolves.toBe(3);

            setHeight(expiration - 1);

            await expect(connection.getPoolSize()).resolves.toBe(3);

            setHeight(expiration);

            switch (transactionVersion) {
                case 1:
                    await expect(connection.getPoolSize()).resolves.toBe(3);
                    break;
                case 2:
                    await expect(connection.getPoolSize()).resolves.toBe(1);
                    break;
            }

            setHeight(heightAtStart + maxTransactionAge);

            switch (transactionVersion) {
                case 1:
                    await expect(connection.getPoolSize()).resolves.toBe(0);
                    break;
                case 2:
                    await expect(connection.getPoolSize()).resolves.toBe(1); // v2 transactions do not expire
                    break;
            }

            for (const t of transactions) {
                connection.removeTransactionById(t.id);
            }

            if (transactionVersion === 1) {
                Managers.configManager.getMilestone().aip11 = true;
            }
        });
    });

    describe("removeTransaction", () => {
        it("should remove the specified transaction from the pool", async () => {
            memory.remember(mockData.dummy1);

            await expect(connection.getPoolSize()).resolves.toBe(1);

            connection.removeTransaction(mockData.dummy1);

            await expect(connection.getPoolSize()).resolves.toBe(0);
        });
    });

    describe("removeTransactionById", () => {
        it("should remove the specified transaction from the pool (by id)", async () => {
            memory.remember(mockData.dummy1);

            await expect(connection.getPoolSize()).resolves.toBe(1);

            connection.removeTransactionById(mockData.dummy1.id);

            await expect(connection.getPoolSize()).resolves.toBe(0);
        });

        it("should do nothing when asked to delete a non-existent transaction", async () => {
            memory.remember(mockData.dummy1);

            connection.removeTransactionById("nonexistenttransactionid");

            await expect(connection.getPoolSize()).resolves.toBe(1);
        });
    });

    describe("removeTransactionsForSender", () => {
        it("should remove the senders transactions from the pool", async () => {
            addTransactions([
                mockData.dummy1,
                mockData.dummy3,
                mockData.dummy4,
                mockData.dummy5,
                mockData.dummy6,
                mockData.dummy10,
            ]);

            await expect(connection.getPoolSize()).resolves.toBe(6);

            connection.removeTransactionsForSender(mockData.dummy1.data.senderPublicKey);

            await expect(connection.getPoolSize()).resolves.toBe(1);
        });
    });

    describe("has", () => {
        it("should return true if transaction is IN pool", async () => {
            addTransactions([mockData.dummy1, mockData.dummy2]);

            expect(await connection.has(mockData.dummy1.id)).toBeTrue();
            expect(await connection.has(mockData.dummy2.id)).toBeTrue();
        });

        it("should return false if transaction is NOT pool", async () => {
            expect(await connection.has(mockData.dummy1.id)).toBeFalse();
            expect(await connection.has(mockData.dummy2.id)).toBeFalse();
        });
    });

    describe("hasExceededMaxTransactions", () => {
        it("should be true if exceeded", async () => {
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

            await expect(connection.getPoolSize()).resolves.toBe(7);
            const exceeded = await connection.hasExceededMaxTransactions(mockData.dummy3.data.senderPublicKey);
            expect(exceeded).toBeTrue();
        });

        it("should be falsy if not exceeded", async () => {
            connection.options.maxTransactionsPerSender = 7;
            connection.options.allowedSenders = [];

            addTransactions([mockData.dummy4, mockData.dummy5, mockData.dummy6]);

            await expect(connection.getPoolSize()).resolves.toBe(3);
            const exceeded = await connection.hasExceededMaxTransactions(mockData.dummy3.data.senderPublicKey);
            expect(exceeded).toBeFalse();
        });

        it("should be allowed to exceed if whitelisted", async () => {
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

            await expect(connection.getPoolSize()).resolves.toBe(7);
            const exceeded = await connection.hasExceededMaxTransactions(mockData.dummy3.data.senderPublicKey);
            expect(exceeded).toBeFalse();
        });
    });

    describe("getTransaction", () => {
        it("should return the specified transaction", async () => {
            addTransactions([mockData.dummy1]);

            const poolTransaction = await connection.getTransaction(mockData.dummy1.id);
            expect(poolTransaction).toBeObject();
            expect(poolTransaction.id).toBe(mockData.dummy1.id);
        });

        it("should return undefined for nonexisting transaction", async () => {
            const poolTransaction = await connection.getTransaction("non existing id");
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
            const added = [
                mockData.dummy1,
                mockData.dummy2,
                mockData.dummy3,
                mockData.dummy4,
                mockData.dummy5,
                mockData.dummy6,
            ];

            addTransactions(added);

            const retrieved = await connection.getTransactionIdsForForging(0, added.length);

            expect(retrieved).toBeArray();
            expect(retrieved).toHaveLength(added.length);
            expect(retrieved[0]).toBe(mockData.dummy1.id);
            expect(retrieved[1]).toBe(mockData.dummy2.id);
            expect(retrieved[2]).toBe(mockData.dummy3.id);
            expect(retrieved[3]).toBe(mockData.dummy4.id);
            expect(retrieved[4]).toBe(mockData.dummy5.id);
            expect(retrieved[5]).toBe(mockData.dummy6.id);
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
            for (let i = 0; i < getMaxTransactionBytes() * 0.6; i++) {
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

            const handler = await Handlers.Registry.get(0);
            const spy = jest.spyOn(handler, "throwIfCannotBeApplied").mockResolvedValue();
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
            const handler = await Handlers.Registry.get(0);
            jest.spyOn(handler, "throwIfCannotBeApplied").mockResolvedValue();

            const transactionsForForging = await connection.getTransactionsForForging(3);
            expect(transactionsForForging.length).toBe(1);
            expect(transactionsForForging[0]).toEqual(mockData.dummyLarge1.serialized.toString("hex"));
        });

        it("should only return transactions not exceeding the maximum payload size", async () => {
            // the idea is to push more transactions to the pool than we can fit in a block
            // so we use multipayments which are large transactions, and we add 1 more transaction
            // than possible in theory (exceeding maxTransactionBytes config value)
            // we then test that we have 1 less transaction returned by getTransactionsForForging than what is in the pool
            const payments = [];
            for (let i = 0; i < 150; i++) {
                payments.push({
                    recipientId: delegates[0].address,
                    amount: "100",
                });
            }
            const largeTransactions = TransactionFactory.multiPayment(payments)
                .withPassphrase(delegatesSecrets[22])
                .build(1000);
            const largeTransactionSize = largeTransactions[0].serialized.byteLength;
            const maxTransactionBytes = getMaxTransactionBytes();
            const maxTxToAdd = Math.floor(maxTransactionBytes / largeTransactionSize);

            for (const transaction of largeTransactions) {
                indexWalletWithSufficientBalance(transaction);
            }

            // we add 1 more transaction than the max that it is possible to forge at once
            addTransactions(largeTransactions.slice(0, maxTxToAdd + 1));

            const handler = await Handlers.Registry.get(Enums.TransactionType.MultiPayment);
            jest.spyOn(handler, "throwIfCannotBeApplied").mockResolvedValue();
            const transactionsForForging = await connection.getTransactionsForForging(1000);

            expect(transactionsForForging.length).toBe(maxTxToAdd);
        });
    });

    describe("flush", () => {
        it("should flush the pool", async () => {
            addTransactions([mockData.dummy1]);

            await expect(connection.getPoolSize()).resolves.toBe(1);

            connection.flush();

            await expect(connection.getPoolSize()).resolves.toBe(0);
        });
    });

    describe("acceptChainedBlock", () => {
        let mockPoolWallet: State.IWallet;
        let mockBlock: Interfaces.IBlock;
        beforeEach(async () => {
            const transactionHandler = await Handlers.Registry.get(TransactionType.Transfer);
            jest.spyOn(transactionHandler, "throwIfCannotBeApplied").mockResolvedValue();

            mockPoolWallet = new Wallets.Wallet(delegates[0].address);
            mockPoolWallet.publicKey = delegates[0].publicKey;

            mockPoolWallet.balance = Utils.BigNumber.make(1e12);

            const transactions = TransactionFactory.transfer(delegates[1].address, 5 * 1e8)
                .withPassphrase(delegates[0].passphrase)
                .create(10);

            mockBlock = BlockFactory.createDummy(transactions);

            connection.walletManager.reindex(mockPoolWallet);
            connection.walletManager.reindex(new Wallets.Wallet(delegates[1].address));
        });
        afterEach(() => {
            jest.restoreAllMocks();
        });

        it("should update wallet when accepting a chained block", async () => {
            const balanceBefore = mockPoolWallet.balance;
            await connection.acceptChainedBlock(mockBlock);

            expect(+mockPoolWallet.balance).toBe(+balanceBefore.minus(mockBlock.data.totalAmount));
        });

        it("should remove transaction from pool if it's in the chained block", async () => {
            updateSenderNonce(mockData.dummy2);

            addTransactions([mockData.dummy2]);

            let transactions = await connection.getTransactions(0, 10);
            expect(transactions).toEqual([mockData.dummy2.serialized]);

            mockBlock.transactions.push(mockData.dummy2);

            await connection.acceptChainedBlock(mockBlock);

            transactions = await connection.getTransactions(0, 10);
            expect(transactions).toEqual([]);
        });

        it("should forget sender if throwIfApplyingFails() failed for a transaction in the chained block", async () => {
            const transactionHandler = await Handlers.Registry.get(TransactionType.Transfer);
            jest.spyOn(transactionHandler, "throwIfCannotBeApplied").mockImplementation(() => {
                throw new Error("test error");
            });

            const { senderPublicKey } = mockBlock.transactions[0].data;
            const forget = jest.spyOn(connection.walletManager, "forget");
            const applyToSender = jest.spyOn(transactionHandler, "applyToSender");

            await connection.acceptChainedBlock(mockBlock);

            expect(connection.walletManager.hasByIndex(State.WalletIndexes.PublicKeys, senderPublicKey)).toBeFalse();
            expect(applyToSender).not.toHaveBeenCalled();
            expect(forget).toHaveBeenCalled();
        });

        it("should delete wallet of transaction sender if its balance is down to zero", async () => {
            jest.spyOn(connection.walletManager, "canBePurged").mockReturnValue(true);
            const forget = jest.spyOn(connection.walletManager, "forget");

            await connection.acceptChainedBlock(mockBlock);

            expect(forget).toHaveBeenCalled();
        });
    });

    describe("buildWallets", () => {
        let findByPublicKey;
        let throwIfCannotBeApplied;
        let applyToSender;
        const findByPublicKeyWallet = new Wallets.Wallet("ANwc3YQe3EBjuE5sNRacP7fhkngAPaBW4Y");
        findByPublicKeyWallet.publicKey = "02778aa3d5b332965ea2a5ef6ac479ce2478535bc681a098dff1d683ff6eccc417";

        beforeEach(async () => {
            const transactionHandler = await Handlers.Registry.get(TransactionType.Transfer);
            throwIfCannotBeApplied = jest.spyOn(transactionHandler, "throwIfCannotBeApplied").mockResolvedValue();
            applyToSender = jest.spyOn(transactionHandler, "applyToSender").mockResolvedValue();

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
            expect(applyToSender).toHaveBeenCalled();
        });
    });

    describe("senderHasTransactionsOfType", () => {
        it("should be false for non-existent sender", async () => {
            addTransactions([mockData.dummy1]);

            await expect(
                connection.senderHasTransactionsOfType("nonexistent", TransactionType.Vote),
            ).resolves.toBeFalse();
        });

        it("should be false for existent sender with no votes", async () => {
            addTransactions([mockData.dummy1]);

            await expect(
                connection.senderHasTransactionsOfType(mockData.dummy1.data.senderPublicKey, TransactionType.Vote),
            ).resolves.toBeFalse();
        });

        it("should be true for existent sender with votes", async () => {
            const tx = mockData.dummy1;

            const voteTx = Transactions.TransactionFactory.fromData(cloneDeep(tx.data));
            voteTx.data.id = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
            voteTx.data.type = TransactionType.Vote;
            voteTx.data.amount = Utils.BigNumber.ZERO;
            voteTx.data.asset = { votes: [`+${tx.data.senderPublicKey}`] };

            const transactions = [tx, voteTx, mockData.dummy2];

            addTransactions(transactions);

            await expect(
                connection.senderHasTransactionsOfType(tx.data.senderPublicKey, TransactionType.Vote),
            ).resolves.toBeTrue();
        });
    });

    describe("shutdown and start", () => {
        it("save and restore transactions", async () => {
            await expect(connection.getPoolSize()).resolves.toBe(0);

            // Reset the senders' nonces to cleanup leftovers from previous tests.
            updateSenderNonce(mockData.dummy1);
            updateSenderNonce(mockData.dummy10);

            // Be sure to use transactions with appropriate nonce - can't fire a transaction
            // with nonce 5 if the sender wallet has nonce 1, for example.
            const transactions = [mockData.dummy1, mockData.dummy10, mockData.dummyLarge1];

            indexWalletWithSufficientBalance(mockData.dummy1);
            indexWalletWithSufficientBalance(mockData.dummyLarge1);

            addTransactions(transactions);

            await expect(connection.getPoolSize()).resolves.toBe(transactions.length);

            connection.disconnect();

            await connection.make();

            container.app.resolvePlugin("event-emitter").emit(ApplicationEvents.StateBuilderFinished);

            await delay(200);

            await expect(connection.getPoolSize()).resolves.toBe(transactions.length);

            for (const t of transactions) {
                expect((await connection.getTransaction(t.id)).serialized).toEqual(t.serialized);
            }

            connection.flush();
        });

        it("remove forged when starting", async () => {
            await expect(connection.getPoolSize()).resolves.toBe(0);

            jest.spyOn(databaseService, "getForgedTransactionsIds").mockReturnValue([mockData.dummy2.id]);

            indexWalletWithSufficientBalance(mockData.dummy1);
            indexWalletWithSufficientBalance(mockData.dummy2);
            indexWalletWithSufficientBalance(mockData.dummy4);

            updateSenderNonce(mockData.dummy1);
            updateSenderNonce(mockData.dummyLarge1);

            const transactions = [mockData.dummy1, mockData.dummy2, mockData.dummyLarge1];

            addTransactions(transactions);

            await expect(connection.getPoolSize()).resolves.toBe(3);

            connection.disconnect();

            await connection.make();

            container.app.resolvePlugin("event-emitter").emit(ApplicationEvents.StateBuilderFinished);

            await delay(200);

            await expect(connection.getPoolSize()).resolves.toBe(2);

            transactions.splice(1, 1);

            for (const t of transactions) {
                expect((await connection.getTransaction(t.id)).serialized).toEqual(t.serialized);
            }

            connection.flush();

            jest.restoreAllMocks();
        });
    });

    describe("stress", () => {
        beforeAll(() => {
            jest.spyOn(connection.walletManager, "throwIfCannotBeApplied").mockResolvedValue();
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

                await connection.addTransactions([transaction]);

                if (i % 27 === 0) {
                    connection.removeTransaction(transaction);
                }
            }

            for (let i = 0; i < testSize * 2; i++) {
                const transaction = testTransactions[i % testSize];
                await connection.getPoolSize();
                for (const senderPublicKey of ["nonexistent", transaction.data.senderPublicKey]) {
                    await connection.getSenderSize(senderPublicKey);
                    await connection.hasExceededMaxTransactions(senderPublicKey);
                }
                await connection.getTransaction(transaction.id);
                await connection.getTransactions(0, i);
            }

            for (let i = 0; i < testSize; i++) {
                connection.removeTransaction(testTransactions[i]);
            }

            // console.timeEnd("multiple additions and retrievals");
        });

        it("delete + add after sync", async () => {
            const testTransactions: Interfaces.ITransaction[] = generateTestTransactions(
                connection.options.syncInterval,
            );

            await connection.addTransactions(testTransactions);

            connection.removeTransaction(testTransactions[0]);
            await connection.addTransactions([testTransactions[0]]);
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
            await connection.addTransactions(testTransactions);
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

        it("sort by fee, nonce", async () => {
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

                // This is not true anymore with current implementation, which is simpler and more performant
                // than the previous one, but it does not do this fee optimization (which is a very specific
                // case and is not worth it currently)
                // if (prevSender !== curSender) {
                //    let j;
                //    for (j = i - 2; j >= 0 && sortedTransactions[j].data.senderPublicKey === prevSender; j--) {
                //        // Find the leftmost transaction in a sequence of transactions from the same
                //        // sender, ending at prevTransaction. That leftmost transaction's fee must
                //        // be greater or equal to the fee of curTransaction.
                //    }
                //    j++;
                //    expect(sortedTransactions[j].data.fee.isGreaterThanEqual(curTransaction.data.fee)).toBeTrue();
                // }

                if (lastNonceBySender[curSender] !== undefined) {
                    expect(lastNonceBySender[curSender].isLessThan(curTransaction.data.nonce)).toBeTrue();
                }

                lastNonceBySender[curSender] = curTransaction.data.nonce;
            }

            jest.restoreAllMocks();
        });
    });

    describe("purgeInvalidTransactions", () => {
        it("should flush the pool", async () => {
            // 64 char vendor field
            Managers.configManager.setHeight(1);

            addTransactions([
                TransactionFactory.transfer("AabMvWPVKbdTHRcGBpATq9TEMiMD5xeJh9", 2 * 1e8, "#".repeat(64))
                    .withNetwork("unitnet")
                    .withPassphrase(delegates[1].passphrase)
                    .build()[0],
            ]);

            await expect(connection.getPoolSize()).resolves.toBe(1);

            await connection.purgeInvalidTransactions();

            await expect(connection.getPoolSize()).resolves.toBe(1);

            // 255 char vendor field
            Managers.configManager.setHeight(100000);

            addTransactions([
                TransactionFactory.transfer("AabMvWPVKbdTHRcGBpATq9TEMiMD5xeJh9", 2 * 1e8, "#".repeat(255))
                    .withNetwork("unitnet")
                    .withPassphrase(delegates[1].passphrase)
                    .build()[0],
            ]);

            await connection.purgeInvalidTransactions();

            await expect(connection.getPoolSize()).resolves.toBe(2);

            // Invalidate transactions with a vendor field longer then 64 chars
            Managers.configManager.setHeight(1);

            jest.spyOn(connection.walletManager, "revertTransactionForSender").mockResolvedValueOnce(undefined);

            await connection.purgeInvalidTransactions();

            await expect(connection.getPoolSize()).resolves.toBe(1);
        });
    });
});
