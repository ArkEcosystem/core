import { Container } from "@arkecosystem/core-container";
import { PostgresConnection } from "@arkecosystem/core-database-postgres";
import { fixtures, generators } from "@arkecosystem/core-test-utils";
import { configManager, crypto, slots } from "@arkecosystem/crypto";
import bip39 from "bip39";
import "jest-extended";
import { TransactionPool } from "../src";
import { TransactionGuard } from "../src";
import { config as localConfig } from "../src/config";
import { setUpFull, tearDown } from "./__support__/setup";

const {
    generateDelegateRegistration,
    generateSecondSignature,
    generateTransfers,
    generateVote,
    generateWallets,
} = generators;

const { delegates } = fixtures;

let container: Container;
let guard;
let transactionPool : TransactionPool;

beforeAll(async () => {
    container = await setUpFull();
    transactionPool = container.resolvePlugin<TransactionPool>("transactionPool");
    localConfig.init(transactionPool.options);
});

afterAll(async () => {
    await tearDown();
});

beforeEach(() => {
    transactionPool.flush();
    guard = new TransactionGuard(transactionPool);
});

describe("Transaction Guard", () => {
    describe("validate", () => {
        it.each([false, true])(
            "should not apply transactions for chained transfers involving cold wallets",
            async inverseOrder => {
                /* The logic here is we can't have a chained transfer A => B => C if B is a cold wallet.
                  A => B needs to be first confirmed (forged), then B can transfer to C
                */

                const arktoshi = 10 ** 8;
                // don't re-use the same delegate (need clean balance)
                const delegate = inverseOrder ? delegates[8] : delegates[9];
                const delegateWallet = transactionPool.walletManager.findByAddress(delegate.address);

                const wallets = generateWallets("testnet", 2);
                const poolWallets = wallets.map(w => transactionPool.walletManager.findByAddress(w.address));

                expect(+delegateWallet.balance).toBe(+delegate.balance);
                poolWallets.forEach(w => {
                    expect(+w.balance).toBe(0);
                });

                const transfer0 = {
                    // transfer from delegate to wallet 0
                    from: delegate,
                    to: wallets[0],
                    amount: 100 * arktoshi,
                };
                const transfer1 = {
                    // transfer from wallet 0 to wallet 1
                    from: wallets[0],
                    to: wallets[1],
                    amount: 55 * arktoshi,
                };
                const transfers = [transfer0, transfer1];
                if (inverseOrder) {
                    transfers.reverse();
                }

                for (const t of transfers) {
                    const transferTx = generateTransfers("testnet", t.from.passphrase, t.to.address, t.amount, 1)[0];

                    await guard.validate([transferTx]);
                }

                // apply again transfer from 0 to 1
                const transfer = generateTransfers(
                    "testnet",
                    transfer1.from.passphrase,
                    transfer1.to.address,
                    transfer1.amount,
                    1,
                )[0];

                await guard.validate([transfer]);

                const expectedError = {
                    message: '["Cold wallet is not allowed to send until receiving transaction is confirmed."]',
                    type: "ERR_APPLY",
                };
                expect(guard.errors[transfer.id]).toContainEqual(expectedError);

                // check final balances
                expect(+delegateWallet.balance).toBe(delegate.balance - (100 + 0.1) * arktoshi);
                expect(+poolWallets[0].balance).toBe(0);
                expect(+poolWallets[1].balance).toBe(0);
            },
        );

        it("should not apply the tx to the balance of the sender & recipient with dyn fee < min fee", async () => {
            const delegate0 = delegates[14];
            const { publicKey } = crypto.getKeys(bip39.generateMnemonic());
            const newAddress = crypto.getAddress(publicKey);

            const delegateWallet = transactionPool.walletManager.findByPublicKey(delegate0.publicKey);
            const newWallet = transactionPool.walletManager.findByPublicKey(publicKey);

            expect(+delegateWallet.balance).toBe(+delegate0.balance);
            expect(+newWallet.balance).toBe(0);

            const amount1 = 123 * 10 ** 8;
            const fee = 10;
            const transfers = generateTransfers("testnet", delegate0.secret, newAddress, amount1, 1, false, fee);

            await guard.validate(transfers);

            expect(+delegateWallet.balance).toBe(+delegate0.balance);
            expect(+newWallet.balance).toBe(0);
        });

        it("should update the balance of the sender & recipient with dyn fee > min fee", async () => {
            const delegate1 = delegates[1];
            const { publicKey } = crypto.getKeys(bip39.generateMnemonic());
            const newAddress = crypto.getAddress(publicKey);

            const delegateWallet = transactionPool.walletManager.findByPublicKey(delegate1.publicKey);
            const newWallet = transactionPool.walletManager.findByPublicKey(publicKey);

            expect(+delegateWallet.balance).toBe(+delegate1.balance);
            expect(+newWallet.balance).toBe(0);

            const amount1 = +delegateWallet.balance / 2;
            const fee = 0.1 * 10 ** 8;
            const transfers = generateTransfers("testnet", delegate1.secret, newAddress, amount1, 1, false, fee);

            await guard.validate(transfers);
            expect(guard.errors).toEqual({});

            // simulate forged transaction
            newWallet.applyTransactionToRecipient(transfers[0]);

            expect(+delegateWallet.balance).toBe(+delegate1.balance - amount1 - fee);
            expect(+newWallet.balance).toBe(amount1);
        });

        it("should update the balance of the sender & recipient with multiple transactions type", async () => {
            const delegate2 = delegates[2];
            const newWalletPassphrase = bip39.generateMnemonic();
            const { publicKey } = crypto.getKeys(newWalletPassphrase);
            const newAddress = crypto.getAddress(publicKey);

            const delegateWallet = transactionPool.walletManager.findByPublicKey(delegate2.publicKey);
            const newWallet = transactionPool.walletManager.findByPublicKey(publicKey);

            expect(+delegateWallet.balance).toBe(+delegate2.balance);
            expect(+newWallet.balance).toBe(0);
            expect(guard.errors).toEqual({});

            const amount1 = +delegateWallet.balance / 2;
            const fee = 0.1 * 10 ** 8;
            const voteFee = 10 ** 8;
            const delegateRegFee = 25 * 10 ** 8;
            const signatureFee = 5 * 10 ** 8;
            const transfers = generateTransfers("testnet", delegate2.secret, newAddress, amount1, 1, false, fee);
            const votes = generateVote("testnet", newWalletPassphrase, delegate2.publicKey, 1);
            const delegateRegs = generateDelegateRegistration("testnet", newWalletPassphrase, 1);
            const signatures = generateSecondSignature("testnet", newWalletPassphrase, 1);

            // Index wallets to not encounter cold wallet error
            const allTransactions = [...transfers, ...votes, ...delegateRegs, ...signatures];

            allTransactions.forEach(transaction => {
                container
                    .resolvePlugin<PostgresConnection>("database")
                    .walletManager.findByPublicKey(transaction.senderPublicKey);
            });

            // first validate the 1st transfer so that new wallet is updated with the amount
            await guard.validate(transfers);

            // simulate forged transaction
            newWallet.applyTransactionToRecipient(transfers[0]);

            expect(guard.errors).toEqual({});
            expect(+newWallet.balance).toBe(amount1);

            // reset guard, if not the 1st transaction will still be in this.accept and mess up
            guard = new TransactionGuard(transactionPool);

            await guard.validate([votes[0], delegateRegs[0], signatures[0]]);

            expect(guard.errors).toEqual({});
            expect(+delegateWallet.balance).toBe(+delegate2.balance - amount1 - fee);
            expect(+newWallet.balance).toBe(amount1 - voteFee - delegateRegFee - signatureFee);
        });

        it("should not accept transaction in excess", async () => {
            const delegate3 = delegates[3];
            const newWalletPassphrase = bip39.generateMnemonic();
            const { publicKey } = crypto.getKeys(newWalletPassphrase);
            const newAddress = crypto.getAddress(publicKey);

            const delegateWallet = transactionPool.walletManager.findByPublicKey(delegate3.publicKey);
            const newWallet = transactionPool.walletManager.findByPublicKey(publicKey);

            // Make sure it is not considered a cold wallet
            container.resolvePlugin<PostgresConnection>("database").walletManager.reindex(newWallet);

            expect(+delegateWallet.balance).toBe(+delegate3.balance);
            expect(+newWallet.balance).toBe(0);

            // first, transfer coins to new wallet so that we can test from it then
            const amount1 = 1000 * 10 ** 8;
            const fee = 0.1 * 10 ** 8;
            const transfers1 = generateTransfers("testnet", delegate3.secret, newAddress, amount1, 1);
            await guard.validate(transfers1);

            // simulate forged transaction
            newWallet.applyTransactionToRecipient(transfers1[0]);

            expect(+delegateWallet.balance).toBe(+delegate3.balance - amount1 - fee);
            expect(+newWallet.balance).toBe(amount1);

            // transfer almost everything from new wallet so that we don't have enough for any other transaction
            const amount2 = 999 * 10 ** 8;
            const transfers2 = generateTransfers("testnet", newWalletPassphrase, delegate3.address, amount2, 1);
            await guard.validate(transfers2);

            // simulate forged transaction
            delegateWallet.applyTransactionToRecipient(transfers2[0]);

            expect(+newWallet.balance).toBe(amount1 - amount2 - fee);

            // now try to validate any other transaction - should not be accepted because in excess
            const transferAmount = 0.5 * 10 ** 8;
            const transferDynFee = 0.5 * 10 ** 8;
            const allTransactions = [
                generateTransfers(
                    "testnet",
                    newWalletPassphrase,
                    delegate3.address,
                    transferAmount,
                    1,
                    false,
                    transferDynFee,
                ),
                generateSecondSignature("testnet", newWalletPassphrase, 1),
                generateVote("testnet", newWalletPassphrase, delegate3.publicKey, 1),
                generateDelegateRegistration("testnet", newWalletPassphrase, 1),
            ];

            for (const transaction of allTransactions) {
                await guard.validate(transaction);

                const errorExpected = [
                    {
                        message: `["[PoolWalletManager] Can't apply transaction id:${transaction[0].id} from sender:${
                            newWallet.address
                        }","Insufficient balance in the wallet"]`,
                        type: "ERR_APPLY",
                    },
                ];
                expect(guard.errors[transaction[0].id]).toEqual(errorExpected);

                expect(+delegateWallet.balance).toBe(+delegate3.balance - amount1 - fee + amount2);
                expect(+newWallet.balance).toBe(amount1 - amount2 - fee);
            }
        });

        it("should not validate 2 double spending transactions", async () => {
            const amount = 245098000000000 - 5098000000000; // a bit less than the delegates' balance
            const transactions = generateTransfers(
                "testnet",
                delegates[0].secret,
                delegates[1].address,
                amount,
                2,
                true,
            );

            const result = await guard.validate(transactions);

            expect(result.errors[transactions[1].id]).toEqual([
                {
                    message: `["[PoolWalletManager] Can't apply transaction id:${transactions[1].id} from sender:${
                        delegates[0].address
                    }","Insufficient balance in the wallet"]`,
                    type: "ERR_APPLY",
                },
            ]);
        });

        it.each([3, 5, 8])("should validate emptying wallet with %i transactions", async txNumber => {
            // use txNumber so that we use a different delegate for each test case
            const sender = delegates[txNumber];
            const senderWallet = transactionPool.walletManager.findByPublicKey(sender.publicKey);
            const receivers = generateWallets("testnet", 2);
            const amountPlusFee = Math.floor(senderWallet.balance / txNumber);
            const lastAmountPlusFee = senderWallet.balance - (txNumber - 1) * amountPlusFee;
            const transferFee = 10000000;

            const transactions = generateTransfers(
                "testnet",
                sender.secret,
                receivers[0].address,
                amountPlusFee - transferFee,
                txNumber - 1,
                true,
            );
            const lastTransaction = generateTransfers(
                "testnet",
                sender.secret,
                receivers[1].address,
                lastAmountPlusFee - transferFee,
                1,
                true,
            );
            // we change the receiver in lastTransaction to prevent having 2 exact
            // same transactions with same id (if not, could be same as transactions[0])

            const result = await guard.validate(transactions.concat(lastTransaction));

            expect(result.errors).toEqual(null);
        });

        it.each([3, 5, 8])(
            "should not validate emptying wallet with %i transactions when the last one is 1 arktoshi too much",
            async txNumber => {
                // use txNumber + 1 so that we don't use the same delegates as the above test
                const sender = delegates[txNumber + 1];
                const receivers = generateWallets("testnet", 2);
                const amountPlusFee = Math.floor(sender.balance / txNumber);
                const lastAmountPlusFee = sender.balance - (txNumber - 1) * amountPlusFee + 1;
                const transferFee = 10000000;

                const transactions = generateTransfers(
                    "testnet",
                    sender.secret,
                    receivers[0].address,
                    amountPlusFee - transferFee,
                    txNumber - 1,
                    true,
                );
                const lastTransaction = generateTransfers(
                    "testnet",
                    sender.secret,
                    receivers[1].address,
                    lastAmountPlusFee - transferFee,
                    1,
                    true,
                );
                // we change the receiver in lastTransaction to prevent having 2
                // exact same transactions with same id (if not, could be same as transactions[0])

                const allTransactions = transactions.concat(lastTransaction);

                const result = await guard.validate(allTransactions);

                expect(Object.keys(result.errors).length).toBe(1);
                expect(result.errors[lastTransaction[0].id]).toEqual([
                    {
                        message: `["[PoolWalletManager] Can't apply transaction id:${
                            lastTransaction[0].id
                        } from sender:${sender.address}","Insufficient balance in the wallet"]`,
                        type: "ERR_APPLY",
                    },
                ]);
            },
        );
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
    });

    describe("__removeForgedTransactions", () => {
        it("should remove forged transactions", async () => {
            const database = container.resolvePlugin<PostgresConnection>("database");
            const getForgedTransactionsIds = database.getForgedTransactionsIds;

            const transfers = generateTransfers("testnet", delegates[0].secret, delegates[0].senderPublicKey, 1, 4);

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
            const transfers = generateTransfers("testnet", delegates[0].secret, delegates[0].senderPublicKey, 1, 4);

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
            const transfers = generateTransfers("testnet", delegates[0].secret, delegates[0].senderPublicKey, 1, 4);

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

            const transfers = generateTransfers("testnet", delegates[0].secret, delegates[0].senderPublicKey, 1, 4);

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
