import { Container } from "@arkecosystem/core-interfaces";
import { generators } from "@arkecosystem/core-test-utils";
import { configManager, constants, crypto, models, slots } from "@arkecosystem/crypto";
import bip39 from "bip39";
import "jest-extended";
import { delegates, genesisBlock, wallets, wallets2ndSig } from "../../core-test-utils/src/fixtures/unitnet";
import { config as localConfig } from "../src/config";
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

    TransactionGuard = require("../src").TransactionGuard;

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
    describe("validate", () => {
        it.each([false, true])(
            "should not apply transactions for chained transfers involving cold wallets",
            async inverseOrder => {
                /* The logic here is we can't have a chained transfer A => B => C if B is a cold wallet.
                  A => B needs to be first confirmed (forged), then B can transfer to C
                */

                const satoshi = 10 ** 8;
                // don't re-use the same delegate (need clean balance)
                const delegate = inverseOrder ? delegates[8] : delegates[9];
                const delegateWallet = transactionPool.walletManager.findByAddress(delegate.address);

                const newWallets = generateWallets("unitnet", 2);
                const poolWallets = newWallets.map(w => transactionPool.walletManager.findByAddress(w.address));

                expect(+delegateWallet.balance).toBe(+delegate.balance);
                poolWallets.forEach(w => {
                    expect(+w.balance).toBe(0);
                });

                const transfer0 = {
                    // transfer from delegate to wallet 0
                    from: delegate,
                    to: newWallets[0],
                    amount: 100 * satoshi,
                };
                const transfer1 = {
                    // transfer from wallet 0 to wallet 1
                    from: newWallets[0],
                    to: newWallets[1],
                    amount: 55 * satoshi,
                };
                const transfers = [transfer0, transfer1];
                if (inverseOrder) {
                    transfers.reverse();
                }

                for (const t of transfers) {
                    const transferTx = generateTransfers("unitnet", t.from.passphrase, t.to.address, t.amount, 1)[0];

                    await guard.validate([transferTx]);
                }

                // apply again transfer from 0 to 1
                const transfer = generateTransfers(
                    "unitnet",
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
                expect(+delegateWallet.balance).toBe(delegate.balance - (100 + 0.1) * satoshi);
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
            const transfers = generateTransfers("unitnet", delegate0.secret, newAddress, amount1, 1, false, fee);

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
            const transfers = generateTransfers("unitnet", delegate1.secret, newAddress, amount1, 1, false, fee);

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
            const transfers = generateTransfers("unitnet", delegate2.secret, newAddress, amount1, 1, false, fee);
            const votes = generateVote("unitnet", newWalletPassphrase, delegate2.publicKey, 1);
            const delegateRegs = generateDelegateRegistration("unitnet", newWalletPassphrase, 1);
            const signatures = generateSecondSignature("unitnet", newWalletPassphrase, 1);

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
            const transfers1 = generateTransfers("unitnet", delegate3.secret, newAddress, amount1, 1);
            await guard.validate(transfers1);

            // simulate forged transaction
            newWallet.applyTransactionToRecipient(transfers1[0]);

            expect(+delegateWallet.balance).toBe(+delegate3.balance - amount1 - fee);
            expect(+newWallet.balance).toBe(amount1);

            // transfer almost everything from new wallet so that we don't have enough for any other transaction
            const amount2 = 999 * 10 ** 8;
            const transfers2 = generateTransfers("unitnet", newWalletPassphrase, delegate3.address, amount2, 1);
            await guard.validate(transfers2);

            // simulate forged transaction
            delegateWallet.applyTransactionToRecipient(transfers2[0]);

            expect(+newWallet.balance).toBe(amount1 - amount2 - fee);

            // now try to validate any other transaction - should not be accepted because in excess
            const transferAmount = 0.5 * 10 ** 8;
            const transferDynFee = 0.5 * 10 ** 8;
            const allTransactions = [
                generateTransfers(
                    "unitnet",
                    newWalletPassphrase,
                    delegate3.address,
                    transferAmount,
                    1,
                    false,
                    transferDynFee,
                ),
                generateSecondSignature("unitnet", newWalletPassphrase, 1),
                generateVote("unitnet", newWalletPassphrase, delegate3.publicKey, 1),
                generateDelegateRegistration("unitnet", newWalletPassphrase, 1),
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
                "unitnet",
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
            const receivers = generateWallets("unitnet", 2);
            const amountPlusFee = Math.floor(senderWallet.balance / txNumber);
            const lastAmountPlusFee = senderWallet.balance - (txNumber - 1) * amountPlusFee;
            const transferFee = 10000000;

            const transactions = generateTransfers(
                "unitnet",
                sender.secret,
                receivers[0].address,
                amountPlusFee - transferFee,
                txNumber - 1,
                true,
            );
            const lastTransaction = generateTransfers(
                "unitnet",
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
            "should not validate emptying wallet with %i transactions when the last one is 1 satoshi too much",
            async txNumber => {
                // use txNumber + 1 so that we don't use the same delegates as the above test
                const sender = delegates[txNumber + 1];
                const receivers = generateWallets("unitnet", 2);
                const amountPlusFee = Math.floor(sender.balance / txNumber);
                const lastAmountPlusFee = sender.balance - (txNumber - 1) * amountPlusFee + 1;
                const transferFee = 10000000;

                const transactions = generateTransfers(
                    "unitnet",
                    sender.secret,
                    receivers[0].address,
                    amountPlusFee - transferFee,
                    txNumber - 1,
                    true,
                );
                const lastTransaction = generateTransfers(
                    "unitnet",
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

        it("should compute transaction id and therefore validate transactions with wrong id", async () => {
            const sender = delegates[21];
            const receivers = generateWallets("unitnet", 1);

            const transactions = generateTransfers("unitnet", sender.secret, receivers[0].address, 50, 1, true);
            const transactionId = transactions[0].id;
            transactions[0].id = "11111";

            const result = await guard.validate(transactions);
            expect(result.accept).toEqual([transactionId]);
            expect(result.broadcast).toEqual([transactionId]);
            expect(result.errors).toBeNull();
        });

        it("should not validate when multiple wallets register the same username in the same transaction payload", async () => {
            const delegateRegistrations = [
                generateDelegateRegistration("unitnet", wallets[14].passphrase, 1, false, "test_delegate")[0],
                generateDelegateRegistration("unitnet", wallets[15].passphrase, 1, false, "test_delegate")[0],
            ];

            const result = await guard.validate(delegateRegistrations);
            expect(result.invalid).toEqual(delegateRegistrations.map(transaction => transaction.id));

            delegateRegistrations.forEach(tx => {
                expect(guard.errors[tx.id]).toEqual([
                    {
                        type: "ERR_CONFLICT",
                        message: `Multiple delegate registrations for "${
                            tx.asset.delegate.username
                        }" in transaction payload`,
                    },
                ]);
            });

            const wallet1 = transactionPool.walletManager.findByPublicKey(wallets[14].keys.publicKey);
            const wallet2 = transactionPool.walletManager.findByPublicKey(wallets[15].keys.publicKey);

            expect(wallet1.username).toBe(null);
            expect(wallet2.username).toBe(null);
        });

        describe("Sign a transaction then change some fields shouldn't pass validation", () => {
            const secondSignatureError = (id, address) => [
                id,
                "ERR_APPLY",
                `["[PoolWalletManager] Can't apply transaction id:${id} from sender:${address}","Failed to verify second-signature"]`,
            ];

            it("should not validate when changing fields after signing - transfer", async () => {
                const sender = delegates[21];
                const notSender = delegates[22];

                // the fields we are going to modify after signing
                const modifiedFields = [
                    { timestamp: 111111 },
                    { amount: 111 },
                    { fee: 1111111 },
                    { recipientId: "ANqvJEMZcmUpcKBC8xiP1TntVkJeuZ3Lw3" },
                    // we are also going to modify senderPublicKey but separately
                ];

                // generate transfers, "simple" and 2nd signed
                const transfers = generateTransfers(
                    "unitnet",
                    sender.secret,
                    "AFzQCx5YpGg5vKMBg4xbuYbqkhvMkKfKe5",
                    50,
                    modifiedFields.length + 1, // + 1 because we will use it to modify senderPublicKey separately
                    true,
                );
                const transfers2ndSigned = generateTransfers(
                    "unitnet",
                    { passphrase: wallets2ndSig[0].passphrase, secondPassphrase: wallets2ndSig[0].secondPassphrase },
                    "AFzQCx5YpGg5vKMBg4xbuYbqkhvMkKfKe5",
                    50,
                    modifiedFields.length + 1, // + 1 because we will use it to modify senderPublicKey separately
                    true,
                );

                // modify transaction fields and try to validate
                const modifiedTransactions = [
                    ...modifiedFields.map((objField, index) => Object.assign({}, transfers[index], objField)),
                    Object.assign({}, transfers[transfers.length - 1], { senderPublicKey: notSender.publicKey }),
                    ...modifiedFields.map((objField, index) => Object.assign({}, transfers2ndSigned[index], objField)),
                    Object.assign({}, transfers2ndSigned[transfers2ndSigned.length - 1], {
                        senderPublicKey: wallets2ndSig[1].keys.publicKey,
                    }),
                ];
                const result = await guard.validate(modifiedTransactions);

                const expectedErrors = [
                    ...transfers.map(transfer => [
                        transfer.id,
                        "ERR_BAD_DATA",
                        "Transaction didn't pass the verification process.",
                    ]),
                    ...transfers2ndSigned
                        .slice(0, -1)
                        .map(transfer => secondSignatureError(transfer.id, wallets2ndSig[0].address)),
                    secondSignatureError(
                        transfers2ndSigned[transfers2ndSigned.length - 1].id,
                        wallets2ndSig[1].address,
                    ),
                ];

                expect(
                    Object.keys(result.errors).map(id => [id, result.errors[id][0].type, result.errors[id][0].message]),
                ).toEqual(expectedErrors);
                expect(result.invalid).toEqual(modifiedTransactions.map(transaction => transaction.id));
                expect(result.accept).toEqual([]);
                expect(result.broadcast).toEqual([]);
            });

            it("should not validate when changing fields after signing - delegate registration", async () => {
                // the fields we are going to modify after signing
                const modifiedFieldsDelReg = [
                    { timestamp: 111111 },
                    { fee: 1111111 },
                    // we are also going to modify senderPublicKey but separately
                ];

                // generate delegate registrations, "simple" and 2nd signed
                const delegateRegs = generateDelegateRegistration(
                    "unitnet",
                    wallets.slice(0, modifiedFieldsDelReg.length + 1).map(w => w.passphrase),
                    1,
                    true,
                );
                const delegateRegs2ndSigned = generateDelegateRegistration(
                    "unitnet",
                    wallets2ndSig
                        .slice(0, modifiedFieldsDelReg.length + 1)
                        .map(w => ({ passphrase: w.passphrase, secondPassphrase: w.secondPassphrase })),
                    1,
                    true,
                );

                // modify transaction fields and try to validate
                const modifiedTransactions = [
                    ...modifiedFieldsDelReg.map((objField, index) => Object.assign({}, delegateRegs[index], objField)),
                    Object.assign({}, delegateRegs[delegateRegs.length - 1], {
                        senderPublicKey: wallets[50].keys.publicKey,
                    }),
                    ...modifiedFieldsDelReg.map((objField, index) =>
                        Object.assign({}, delegateRegs2ndSigned[index], objField),
                    ),
                    Object.assign({}, delegateRegs2ndSigned[delegateRegs2ndSigned.length - 1], {
                        senderPublicKey: wallets2ndSig[50].keys.publicKey,
                    }),
                ];
                const result = await guard.validate(modifiedTransactions);

                const expectedErrors = [
                    ...delegateRegs.map(tx => [
                        tx.id,
                        "ERR_BAD_DATA",
                        "Transaction didn't pass the verification process.",
                    ]),
                    ...delegateRegs2ndSigned
                        .slice(0, -1)
                        .map((tx, index) => secondSignatureError(tx.id, wallets2ndSig[index].address)),
                    secondSignatureError(
                        delegateRegs2ndSigned[delegateRegs2ndSigned.length - 1].id,
                        wallets2ndSig[50].address,
                    ),
                ];

                expect(
                    Object.keys(result.errors).map(id => [id, result.errors[id][0].type, result.errors[id][0].message]),
                ).toEqual(expectedErrors);
                expect(result.invalid).toEqual(modifiedTransactions.map(transaction => transaction.id));
                expect(result.accept).toEqual([]);
                expect(result.broadcast).toEqual([]);
            });

            it("should not validate when changing fields after signing - vote", async () => {
                // the fields we are going to modify after signing
                const modifiedFieldsVote = [
                    { timestamp: 111111 },
                    { fee: 1111111 },
                    // we are also going to modify senderPublicKey but separately
                ];

                // generate votes, "simple" and 2nd signed
                const votes = generateVote(
                    "unitnet",
                    wallets.slice(0, modifiedFieldsVote.length + 1).map(w => w.passphrase),
                    delegates[21].publicKey,
                    1,
                    true,
                );
                const votes2ndSigned = generateVote(
                    "unitnet",
                    wallets2ndSig
                        .slice(0, modifiedFieldsVote.length + 1)
                        .map(w => ({ passphrase: w.passphrase, secondPassphrase: w.secondPassphrase })),
                    delegates[21].publicKey,
                    1,
                    true,
                );

                // modify transaction fields and try to validate
                const modifiedTransactions = [
                    ...modifiedFieldsVote.map((objField, index) => Object.assign({}, votes[index], objField)),
                    Object.assign({}, votes[votes.length - 1], { senderPublicKey: wallets[50].keys.publicKey }),
                    ...modifiedFieldsVote.map((objField, index) => Object.assign({}, votes2ndSigned[index], objField)),
                    Object.assign({}, votes2ndSigned[votes2ndSigned.length - 1], {
                        senderPublicKey: wallets2ndSig[50].keys.publicKey,
                    }),
                ];
                const result = await guard.validate(modifiedTransactions);

                const expectedErrors = [
                    ...votes.map(tx => [tx.id, "ERR_BAD_DATA", "Transaction didn't pass the verification process."]),
                    ...votes2ndSigned
                        .slice(0, -1)
                        .map((tx, index) => secondSignatureError(tx.id, wallets2ndSig[index].address)),
                    secondSignatureError(votes2ndSigned[votes2ndSigned.length - 1].id, wallets2ndSig[50].address),
                ];

                expect(
                    Object.keys(result.errors).map(id => [id, result.errors[id][0].type, result.errors[id][0].message]),
                ).toEqual(expectedErrors);
                expect(result.invalid).toEqual(modifiedTransactions.map(transaction => transaction.id));
                expect(result.accept).toEqual([]);
                expect(result.broadcast).toEqual([]);
            });

            it("should not validate when changing fields after signing - 2nd signature registration", async () => {
                // the fields we are going to modify after signing
                const modifiedFields2ndSig = [
                    { timestamp: 111111 },
                    { fee: 1111111 },
                    { senderPublicKey: wallets[50].keys.publicKey },
                ];

                const secondSigs = generateSecondSignature(
                    "unitnet",
                    wallets.slice(0, modifiedFields2ndSig.length).map(w => w.passphrase),
                    1,
                    true,
                );

                const modifiedTransactions = modifiedFields2ndSig.map((objField, index) =>
                    Object.assign({}, secondSigs[index], objField),
                );
                const result = await guard.validate(modifiedTransactions);

                expect(
                    Object.keys(result.errors).map(id => [id, result.errors[id][0].type, result.errors[id][0].message]),
                ).toEqual(
                    secondSigs.map(tx => [tx.id, "ERR_BAD_DATA", "Transaction didn't pass the verification process."]),
                );
                expect(result.invalid).toEqual(modifiedTransactions.map(transaction => transaction.id));
                expect(result.accept).toEqual([]);
                expect(result.broadcast).toEqual([]);
            });
        });

        describe("Transaction replay shouldn't pass validation", () => {
            afterEach(async () => blockchain.removeBlocks(blockchain.getLastHeight() - 1)); // resets to height 1

            const addBlock = async transactions => {
                // makes blockchain accept a new block with the transactions specified
                const block = {
                    id: "17882607875259085966",
                    version: 0,
                    timestamp: 46583330,
                    height: 2,
                    reward: 0,
                    previousBlock: genesisBlock.id,
                    numberOfTransactions: 1,
                    transactions,
                    totalAmount: transactions.reduce((acc, curr) => acc + curr.amount),
                    totalFee: transactions.reduce((acc, curr) => acc + curr.fee),
                    payloadLength: 0,
                    payloadHash: genesisBlock.payloadHash,
                    generatorPublicKey: delegates[0].publicKey,
                    blockSignature:
                        "3045022100e7385c6ea42bd950f7f6ab8c8619cf2f66a41d8f8f185b0bc99af032cb25f30d02200b6210176a6cedfdcbe483167fd91c21d740e0e4011d24d679c601fdd46b0de9",
                    createdAt: "2019-07-11T16:48:50.550Z",
                };
                const blockVerified = new Block(block);
                blockVerified.verification.verified = true;

                await blockchain.processBlock(blockVerified, () => null);
            };
            const forgedErrorMessage = id => ({
                [id]: [
                    {
                        message: "Already forged.",
                        type: "ERR_FORGED",
                    },
                ],
            });

            it("should not validate an already forged transaction", async () => {
                const transfers = generateTransfers("unitnet", wallets[0].passphrase, wallets[1].address, 11, 1, true);
                await addBlock(transfers);

                const result = await guard.validate(transfers);

                expect(result.errors).toEqual(forgedErrorMessage(transfers[0].id));
            });

            it("should not validate an already forged transaction - trying to tweak tx id", async () => {
                const transfers = generateTransfers("unitnet", wallets[0].passphrase, wallets[1].address, 11, 1, true);
                await addBlock(transfers);

                const realTransferId = transfers[0].id;
                transfers[0].id = "123456";

                const result = await guard.validate(transfers);

                expect(result.errors).toEqual(forgedErrorMessage(realTransferId));
            });
        });
    });

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
