import { Container } from "@arkecosystem/core-interfaces";
import { TransactionServiceRegistry } from "@arkecosystem/core-transactions";
import { crypto, ITransactionData, models } from "@arkecosystem/crypto";
import bip39 from "bip39";
import "jest-extended";
import { config as localConfig } from "../../../packages/core-transaction-pool/src/config";
import { generators } from "../../utils";
import { delegates, genesisBlock, wallets, wallets2ndSig } from "../../utils/fixtures/unitnet";
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

                    await guard.validate([transferTx.data]);
                }

                // apply again transfer from 0 to 1
                const transfer = generateTransfers(
                    "unitnet",
                    transfer1.from.passphrase,
                    transfer1.to.address,
                    transfer1.amount,
                    1,
                )[0];

                await guard.validate([transfer.data]);

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

            await guard.validate(transfers.map(tx => tx.data));

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
            await guard.validate(transfers.map(tx => tx.data));
            expect(guard.errors).toEqual({});

            // simulate forged transaction
            const transactionService = TransactionServiceRegistry.get(transfers[0].type);
            transactionService.applyToRecipient(transfers[0], newWallet);

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
                container.resolvePlugin("database").walletManager.findByPublicKey(transaction.data.senderPublicKey);
            });

            // first validate the 1st transfer so that new wallet is updated with the amount
            await guard.validate(transfers.map(tx => tx.data));

            // simulate forged transaction
            const transactionService = TransactionServiceRegistry.get(transfers[0].type);
            transactionService.applyToRecipient(transfers[0], newWallet);

            expect(guard.errors).toEqual({});
            expect(+newWallet.balance).toBe(amount1);

            // reset guard, if not the 1st transaction will still be in this.accept and mess up
            guard = new TransactionGuard(transactionPool);

            await guard.validate([votes[0].data, delegateRegs[0].data, signatures[0].data]);

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
            await guard.validate(transfers1.map(tx => tx.data));

            // simulate forged transaction
            const transactionService = TransactionServiceRegistry.get(transfers1[0].type);
            transactionService.applyToRecipient(transfers1[0], newWallet);

            expect(+delegateWallet.balance).toBe(+delegate3.balance - amount1 - fee);
            expect(+newWallet.balance).toBe(amount1);

            // transfer almost everything from new wallet so that we don't have enough for any other transaction
            const amount2 = 999 * 10 ** 8;
            const transfers2 = generateTransfers("unitnet", newWalletPassphrase, delegate3.address, amount2, 1);
            await guard.validate(transfers2.map(tx => tx.data));

            // simulate forged transaction
            transactionService.applyToRecipient(transfers2[0], delegateWallet);

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
                await guard.validate(transaction.map(tx => tx.data));

                const errorExpected = [
                    {
                        message: `["Insufficient balance in the wallet."]`,
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
                    message: `["Insufficient balance in the wallet."]`,
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
                        message: `["Insufficient balance in the wallet."]`,
                        type: "ERR_APPLY",
                    },
                ]);
            },
        );

        it("should compute transaction id and therefore validate transactions with wrong id", async () => {
            const sender = delegates[21];
            const receivers = generateWallets("unitnet", 1);

            const transactions: ITransactionData[] = generateTransfers(
                "unitnet",
                sender.secret,
                receivers[0].address,
                50,
                1,
                true,
            );
            const transactionId = transactions[0].id;
            transactions[0].id = "a".repeat(64);

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

            const result = await guard.validate(delegateRegistrations.map(transaction => transaction.data));
            expect(result.invalid).toEqual(delegateRegistrations.map(transaction => transaction.id));

            delegateRegistrations.forEach(tx => {
                expect(guard.errors[tx.id]).toEqual([
                    {
                        type: "ERR_CONFLICT",
                        message: `Multiple delegate registrations for "${
                            tx.data.asset.delegate.username
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
                    ...[...transfers, ...transfers2ndSigned].map(transfer => [
                        transfer.id,
                        "ERR_BAD_DATA",
                        "Transaction didn't pass the verification process.",
                    ]),
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
                    ...[...delegateRegs, ...delegateRegs2ndSigned].map(transfer => [
                        transfer.id,
                        "ERR_BAD_DATA",
                        "Transaction didn't pass the verification process.",
                    ]),
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
                    ...votes2ndSigned.map(tx => [
                        tx.id,
                        "ERR_BAD_DATA",
                        "Transaction didn't pass the verification process.",
                    ]),
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
                transfers[0].id = "c".repeat(64);

                const result = await guard.validate(transfers);

                expect(result.errors).toEqual(forgedErrorMessage(realTransferId));
            });
        });
    });

    describe("__cacheTransactions", () => {
        it("should add transactions to cache", () => {
            const transactions = generateTransfers("unitnet", wallets[10].passphrase, wallets[11].address, 35, 3);
            expect(guard.__cacheTransactions(transactions.map(tx => tx.data))).toEqual(transactions.map(tx => tx.data));
        });

        it("should not add a transaction already in cache and add it as an error", () => {
            const transactions = generateTransfers("unitnet", wallets[11].passphrase, wallets[12].address, 35, 3);
            expect(guard.__cacheTransactions(transactions.map(tx => tx.data))).toEqual(transactions.map(tx => tx.data));
            expect(guard.__cacheTransactions([transactions[0].data])).toEqual([]);
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
});
