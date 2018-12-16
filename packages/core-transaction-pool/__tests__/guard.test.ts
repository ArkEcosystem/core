import { fixtures, generators } from "@arkecosystem/core-test-utils";
import "jest-extended";

import { crypto } from "@arkecosystem/crypto";
import { TransactionGuard } from "../src/guard";

import bip39 from "bip39";
import { setUpFull, tearDown } from "./__support__/setup";

const {
    generateDelegateRegistration,
    generateSecondSignature,
    generateTransfers,
    generateVote,
    generateWallets,
} = generators;

const { delegates } = fixtures;

let container;
let guard;
let transactionPool;

beforeAll(async () => {
    container = await setUpFull();
    transactionPool = container.resolvePlugin("transactionPool");
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
                container.resolvePlugin("database").walletManager.findByPublicKey(transaction.senderPublicKey);
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
            container.resolvePlugin("database").walletManager.reindex(newWallet);

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
});
