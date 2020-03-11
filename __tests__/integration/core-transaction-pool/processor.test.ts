import "jest-extended";

import { Blockchain, Container, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Handlers } from "@arkecosystem/core-transactions";
import { Blocks, Crypto, Identities, Interfaces, Managers, Utils } from "@arkecosystem/crypto";
import { generateMnemonic } from "bip39";
import { TransactionFactory } from "../../helpers/transaction-factory";
import { delegates, wallets, wallets2ndSig } from "../../utils/fixtures/unitnet";
import { generateWallets } from "../../utils/generators/wallets";
import { setUpFull, tearDownFull } from "./__support__/setup";
// import { Crypto, Enums, Managers } from "@arkecosystem/crypto";
// import { Connection } from "../../../packages/core-transaction-pool/src/connection";
// import { delegates, wallets } from "../../utils/fixtures/unitnet";

let container: Container.IContainer;
let processor: TransactionPool.IProcessor;
let transactionPool: TransactionPool.IConnection;
let blockchain: Blockchain.IBlockchain;

beforeAll(async () => {
    container = await setUpFull();

    transactionPool = container.resolvePlugin("transaction-pool");
    blockchain = container.resolvePlugin("blockchain");
});

afterAll(async () => {
    await container.resolvePlugin("database").reset();

    await tearDownFull();
});

beforeEach(() => {
    transactionPool.flush();
    processor = transactionPool.makeProcessor();
});

describe("Transaction Guard", () => {
    describe("validate", () => {
        it("should update recipient pool wallet balance when receiving a multipayment", async () => {
            const walletGen = generateWallets("unitnet", 1)[0];
            const wallet = transactionPool.walletManager.findByAddress(walletGen.address);

            const block = {
                id: "17882607875259085966",
                version: 0,
                timestamp: 46583330,
                height: 2,
                reward: Utils.BigNumber.make(0),
                previousBlock: "17882607875259085966",
                numberOfTransactions: 1,
                transactions: [],
                totalAmount: Utils.BigNumber.make(0),
                totalFee: Utils.BigNumber.make(0),
                payloadLength: 0,
                payloadHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                generatorPublicKey: delegates[0].publicKey,
                blockSignature:
                    "3045022100e7385c6ea42bd950f7f6ab8c8619cf2f66a41d8f8f185b0bc99af032cb25f30d02200b6210176a6cedfdcbe483167fd91c21d740e0e4011d24d679c601fdd46b0de9",
                createdAt: "2019-07-11T16:48:50.550Z",
            };

            let tx = TransactionFactory.transfer(walletGen.address, 1 * 100000000)
                .withNetwork("unitnet")
                .withPassphrase(wallets[0].passphrase)
                .build()[0];

            block.transactions = [tx.data];
            transactionPool.acceptChainedBlock(Blocks.BlockFactory.fromData(block));

            // simulate forged transaction
            const transactionHandler = await Handlers.Registry.get(tx.type);
            transactionHandler.applyToRecipient(tx, transactionPool.walletManager);

            tx = TransactionFactory.transfer(wallets[0].address, 1)
                .withNetwork("unitnet")
                .withPassphrase(walletGen.passphrase)
                .build()[0];

            block.transactions = [tx.data];
            transactionPool.acceptChainedBlock(Blocks.BlockFactory.fromData(block));

            // simulate forged transaction
            transactionHandler.applyToRecipient(tx, transactionPool.walletManager);

            transactionPool.walletManager.reindex(wallet);

            tx = TransactionFactory.multiPayment([
                { recipientId: wallets[0].address, amount: "500000000" },
                { recipientId: walletGen.address, amount: "500000000" },
            ])
                .withNetwork("unitnet")
                .withPassphrase(wallets[0].passphrase)
                .build()[0];

            block.transactions = [tx.data];
            transactionPool.acceptChainedBlock(Blocks.BlockFactory.fromData(block));

            container.resolvePlugin("database").walletManager.reindex(wallet);

            const transaction = TransactionFactory.transfer(walletGen.address, 2 * 100000000)
                .withNetwork("unitnet")
                .withNonce(wallet.nonce.plus(1))
                .withPassphrase(walletGen.passphrase)
                .build()[0];

            await processor.validate([transaction.data]);
            expect(processor.getErrors()[transaction.id]).toBeUndefined();
        });

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
                for (const wallet of poolWallets) {
                    expect(+wallet.balance).toBe(0);
                }

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
                    const transferTx = TransactionFactory.transfer(t.to.address, t.amount)
                        .withNetwork("unitnet")
                        .withPassphrase(t.from.passphrase)
                        .build()[0];

                    await processor.validate([transferTx.data]);
                }

                // apply again transfer from 0 to 1
                const transfer = TransactionFactory.transfer(transfer1.to.address, transfer1.amount)
                    .withNetwork("unitnet")
                    .withPassphrase(transfer1.from.passphrase)
                    .build()[0];

                await processor.validate([transfer.data]);

                const expectedError = {
                    message:
                        "Insufficient balance in database wallet. Wallet is not allowed to spend before funding is confirmed.",
                    type: "ERR_APPLY",
                };
                expect(processor.getErrors()[transfer.id]).toContainEqual(expectedError);

                // check final balances
                expect(+delegateWallet.balance).toBe(delegate.balance - (100 + 0.1) * satoshi);
                expect(+poolWallets[0].balance).toBe(0);
                expect(+poolWallets[1].balance).toBe(0);
            },
        );

        it("should not apply the tx to the balance of the sender & recipient with dyn fee < min fee", async () => {
            const delegate0 = delegates[14];
            const { publicKey } = Identities.Keys.fromPassphrase(generateMnemonic());
            const newAddress = Identities.Address.fromPublicKey(publicKey);

            const delegateWallet = transactionPool.walletManager.findByPublicKey(delegate0.publicKey);
            const newWallet = transactionPool.walletManager.findByPublicKey(publicKey);

            expect(+delegateWallet.balance).toBe(+delegate0.balance);
            expect(+newWallet.balance).toBe(0);

            const amount1 = 123 * 10 ** 8;
            const fee = 10;
            const transfers = TransactionFactory.transfer(newAddress, amount1)
                .withNetwork("unitnet")
                .withFee(fee)
                .withPassphrase(delegate0.secret)
                .build();

            await processor.validate(transfers.map(tx => tx.data));

            expect(+delegateWallet.balance).toBe(+delegate0.balance);
            expect(+newWallet.balance).toBe(0);
        });

        it("should update the balance of the sender & recipient with dyn fee > min fee", async () => {
            const delegate1 = delegates[1];
            const { publicKey } = Identities.Keys.fromPassphrase(generateMnemonic());
            const newAddress = Identities.Address.fromPublicKey(publicKey);

            const delegateWallet = transactionPool.walletManager.findByPublicKey(delegate1.publicKey);
            const newWallet = transactionPool.walletManager.findByPublicKey(publicKey);

            transactionPool.walletManager.reindex(delegateWallet);
            transactionPool.walletManager.reindex(newWallet);

            expect(+delegateWallet.balance).toBe(+delegate1.balance);
            expect(+newWallet.balance).toBe(0);

            const amount1 = +delegateWallet.balance / 2;
            const fee = 0.1 * 10 ** 8;
            const transfers = TransactionFactory.transfer(newAddress, amount1)
                .withNetwork("unitnet")
                .withFee(fee)
                .withPassphrase(delegate1.secret)
                .build();
            await processor.validate(transfers.map(tx => tx.data));
            expect(processor.getErrors()).toEqual({});

            // simulate forged transaction
            const transactionHandler = await Handlers.Registry.get(transfers[0].type);
            transactionHandler.applyToRecipient(transfers[0], transactionPool.walletManager);

            expect(+delegateWallet.balance).toBe(+delegate1.balance - amount1 - fee);
            expect(+newWallet.balance).toBe(amount1);
        });

        it("should update the balance of the sender & recipient with multiple transactions type", async () => {
            const delegate2 = delegates[2];
            const newWalletPassphrase = generateMnemonic();
            const { publicKey } = Identities.Keys.fromPassphrase(newWalletPassphrase);
            const newAddress = Identities.Address.fromPublicKey(publicKey);

            const delegateWallet = transactionPool.walletManager.findByPublicKey(delegate2.publicKey);
            const newWallet = transactionPool.walletManager.findByPublicKey(publicKey);

            transactionPool.walletManager.reindex(delegateWallet);
            transactionPool.walletManager.reindex(newWallet);

            expect(+delegateWallet.balance).toBe(+delegate2.balance);
            expect(+newWallet.balance).toBe(0);
            expect(processor.getErrors()).toEqual({});

            const amount1 = delegateWallet.balance / 2;
            const fee = 0.1 * 1e8;
            const voteFee = 1e8;
            const delegateRegFee = 25 * 1e8;
            const signatureFee = 5 * 1e8;

            const transfers = TransactionFactory.transfer(newAddress, amount1)
                .withNetwork("unitnet")
                .withFee(fee)
                .withPassphrase(delegate2.secret)
                .build();

            const nonce = TransactionFactory.getNonce(publicKey);
            const votes = TransactionFactory.vote(delegate2.publicKey)
                .withNetwork("unitnet")
                .withPassphrase(newWalletPassphrase)
                .withNonce(nonce)
                .build();
            const delegateRegs = TransactionFactory.delegateRegistration()
                .withNetwork("unitnet")
                .withPassphrase(newWalletPassphrase)
                .withNonce(nonce.plus(1))
                .build();
            const signatures = TransactionFactory.secondSignature()
                .withNetwork("unitnet")
                .withPassphrase(newWalletPassphrase)
                .withNonce(nonce.plus(2))
                .build();

            // Index wallets to not encounter cold wallet error
            const allTransactions = [...transfers, ...votes, ...delegateRegs, ...signatures];

            for (const transaction of allTransactions) {
                container.resolvePlugin("database").walletManager.findByPublicKey(transaction.data.senderPublicKey);
            }

            // first validate the 1st transfer so that new wallet is updated with the amount
            await processor.validate(transfers.map(tx => tx.data));

            // simulate forged transaction
            const transactionHandler = await Handlers.Registry.get(transfers[0].type);
            transactionHandler.applyToRecipient(transfers[0], transactionPool.walletManager);

            expect(processor.getErrors()).toEqual({});
            expect(+newWallet.balance).toBe(amount1);

            // reset processor, if not the 1st transaction will still be in this.accept and mess up
            processor = transactionPool.makeProcessor();

            await processor.validate([votes[0].data, delegateRegs[0].data, signatures[0].data]);

            expect(processor.getErrors()).toEqual({});
            expect(+delegateWallet.balance).toBe(+delegate2.balance - amount1 - fee);
            expect(+newWallet.balance).toBe(amount1 - voteFee - delegateRegFee - signatureFee);
        });

        it("should not accept transaction in excess", async () => {
            const delegate3 = delegates[3];
            const newWalletPassphrase = generateMnemonic();
            const { publicKey } = Identities.Keys.fromPassphrase(newWalletPassphrase);
            const newAddress = Identities.Address.fromPublicKey(publicKey);

            const delegateWallet = transactionPool.walletManager.findByPublicKey(delegate3.publicKey);
            const newWallet = transactionPool.walletManager.findByPublicKey(publicKey);

            // Make sure it is not considered a cold wallet
            container.resolvePlugin("database").walletManager.reindex(newWallet);
            transactionPool.walletManager.reindex(delegateWallet);
            transactionPool.walletManager.reindex(newWallet);

            expect(+delegateWallet.balance).toBe(+delegate3.balance);
            expect(+newWallet.balance).toBe(0);

            // first, transfer coins to new wallet so that we can test from it then
            const amount1 = 1000 * 10 ** 8;
            const fee = 0.1 * 10 ** 8;
            const transfers1 = TransactionFactory.transfer(newAddress, amount1)
                .withNetwork("testnet")
                .withPassphrase(delegate3.secret)
                .build();
            await processor.validate(transfers1.map(tx => tx.data));

            // simulate forged transaction
            const transactionHandler = await Handlers.Registry.get(transfers1[0].type);
            transactionHandler.applyToRecipient(transfers1[0], transactionPool.walletManager);

            expect(+delegateWallet.balance).toBe(+delegate3.balance - amount1 - fee);
            expect(+newWallet.balance).toBe(amount1);

            // transfer almost everything from new wallet so that we don't have enough for any other transaction
            const amount2 = 999 * 10 ** 8;
            const transfers2 = TransactionFactory.transfer(delegate3.address, amount2)
                .withNetwork("testnet")
                .withPassphrase(newWalletPassphrase)
                .build();
            await processor.validate(transfers2.map(tx => tx.data));

            // simulate forged transaction
            transactionHandler.applyToRecipient(transfers2[0], transactionPool.walletManager);

            expect(+newWallet.balance).toBe(amount1 - amount2 - fee);

            // now try to validate any other transaction - should not be accepted because in excess

            const transferAmount = 0.5 * 10 ** 8;
            const transferDynFee = 0.5 * 10 ** 8;

            const allTransactions = [
                TransactionFactory.transfer(delegate3.address, transferAmount)
                    .withNetwork("testnet")
                    .withFee(transferDynFee)
                    .withPassphrase(newWalletPassphrase)
                    .withNonce(Utils.BigNumber.ONE)
                    .build(),
                TransactionFactory.secondSignature()
                    .withNetwork("testnet")
                    .withPassphrase(newWalletPassphrase)
                    .withNonce(Utils.BigNumber.ONE)
                    .build(),
                TransactionFactory.vote(delegate3.publicKey)
                    .withNetwork("testnet")
                    .withPassphrase(newWalletPassphrase)
                    .withNonce(Utils.BigNumber.ONE)
                    .build(),
                TransactionFactory.delegateRegistration()
                    .withNetwork("testnet")
                    .withPassphrase(newWalletPassphrase)
                    .withNonce(Utils.BigNumber.ONE)
                    .build(),
            ];

            for (const transactions of allTransactions) {
                await processor.validate(transactions.map(tx => tx.data));

                const errorExpected = [
                    {
                        message: "Insufficient balance in the wallet.",
                        type: "ERR_APPLY",
                    },
                ];
                expect(processor.getErrors()[transactions[0].id]).toEqual(errorExpected);

                expect(+delegateWallet.balance).toBe(+delegate3.balance - amount1 - fee + amount2);
                expect(+newWallet.balance).toBe(amount1 - amount2 - fee);
            }
        });

        it("should not validate 2 double spending transactions", async () => {
            const amount = 245098000000000 - 5098000000000; // a bit less than the delegates' balance
            const transactions = TransactionFactory.transfer(delegates[1].address, amount)
                .withNetwork("testnet")
                .withPassphrase(delegates[0].secret)
                .withNonce(Utils.BigNumber.ZERO)
                .create(2);

            const result = await processor.validate(transactions);

            expect(result.errors[transactions[1].id]).toEqual([
                {
                    message: "Insufficient balance in the wallet.",
                    type: "ERR_APPLY",
                },
            ]);
        });

        it.each([3, 5, 8])("should validate emptying wallet with %i transactions", async txNumber => {
            // use txNumber so that we use a different delegate for each test case
            const sender = delegates[txNumber + 1];
            const senderWallet = transactionPool.walletManager.findByPublicKey(sender.publicKey);

            const receivers = generateWallets("testnet", 2);
            const amountPlusFee = Math.floor(senderWallet.balance / txNumber);
            const lastAmountPlusFee = senderWallet.balance - (txNumber - 1) * amountPlusFee;
            const transferFee = 10000000;

            const nonce = senderWallet.nonce;
            const transactions = TransactionFactory.transfer(receivers[0].address, amountPlusFee - transferFee)
                .withNetwork("testnet")
                .withNonce(nonce)
                .withPassphrase(sender.secret)
                .create(txNumber - 1);
            const lastTransaction = TransactionFactory.transfer(receivers[0].address, lastAmountPlusFee - transferFee)
                .withNetwork("testnet")
                .withNonce(nonce.plus(txNumber - 1))
                .withPassphrase(sender.secret)
                .create();

            const result = await processor.validate(transactions.concat(lastTransaction));

            expect(result.errors).toEqual(undefined);
        });

        it.each([3, 5, 8])(
            "should not validate emptying wallet with %i transactions when the last one is 1 satoshi too much",
            async txNumber => {
                // use txNumber + 1 so that we don't use the same delegates as the above test
                const sender = delegates[txNumber + 2];
                const receivers = generateWallets("testnet", 2);
                const amountPlusFee = Math.floor(sender.balance / txNumber);
                const lastAmountPlusFee = sender.balance - (txNumber - 1) * amountPlusFee + 1;
                const transferFee = 10000000;

                const nonce = TransactionFactory.getNonce(sender.publicKey);
                const transactions = TransactionFactory.transfer(receivers[0].address, amountPlusFee - transferFee)
                    .withNetwork("testnet")
                    .withPassphrase(sender.secret)
                    .create(txNumber - 1);
                const lastTransaction = TransactionFactory.transfer(
                    receivers[1].address,
                    lastAmountPlusFee - transferFee,
                )
                    .withNetwork("testnet")
                    .withNonce(nonce.plus(txNumber - 1))
                    .withPassphrase(sender.secret)
                    .create();
                // we change the receiver in lastTransaction to prevent having 2
                // exact same transactions with same id (if not, could be same as transactions[0])

                const allTransactions = transactions.concat(lastTransaction);

                const result = await processor.validate(allTransactions);

                expect(Object.keys(result.errors).length).toBe(1);
                expect(result.errors[lastTransaction[0].id]).toEqual([
                    {
                        message: "Insufficient balance in the wallet.",
                        type: "ERR_APPLY",
                    },
                ]);
            },
        );

        it("should compute transaction id and therefore validate transactions with wrong id", async () => {
            const sender = delegates[21];
            const receivers = generateWallets("unitnet", 1);

            const transactions: Interfaces.ITransactionData[] = TransactionFactory.transfer(receivers[0].address, 50)
                .withNetwork("unitnet")
                .withPassphrase(sender.secret)
                .create();
            const transactionId = transactions[0].id;
            transactions[0].id = "a".repeat(64);

            const result = await processor.validate(transactions);
            expect(result.accept).toEqual([transactionId]);
            expect(result.broadcast).toEqual([transactionId]);
            expect(result.errors).toBeUndefined();
        });

        it("should not validate when multiple wallets register the same username in the same transaction payload", async () => {
            const delegateRegistrations = [
                TransactionFactory.delegateRegistration("test_delegate")
                    .withNetwork("unitnet")
                    .withPassphrase(wallets[14].passphrase)
                    .build()[0],
                TransactionFactory.delegateRegistration("test_delegate")
                    .withNetwork("unitnet")
                    .withPassphrase(wallets[15].passphrase)
                    .build()[0],
            ];

            const result = await processor.validate(delegateRegistrations.map(transaction => transaction.data));
            expect(result.invalid).toEqual(delegateRegistrations.map(transaction => transaction.id));

            for (const tx of delegateRegistrations) {
                expect(processor.getErrors()[tx.id]).toEqual([
                    {
                        type: "ERR_CONFLICT",
                        message: `Multiple delegate registrations for "${tx.data.asset.delegate.username}" in transaction payload`,
                    },
                ]);
            }

            const wallet1 = transactionPool.walletManager.findByPublicKey(wallets[14].keys.publicKey);
            const wallet2 = transactionPool.walletManager.findByPublicKey(wallets[15].keys.publicKey);

            expect(wallet1.isDelegate()).toBeFalse();
            expect(wallet2.isDelegate()).toBeFalse();
        });

        it("should not validate a transaction if a second signature registration for the same wallet exists in the pool", async () => {
            const nonce = TransactionFactory.getNonce(Identities.PublicKey.fromPassphrase(wallets[16].passphrase));

            const secondSignatureTransaction = TransactionFactory.secondSignature()
                .withNetwork("unitnet")
                .withNonce(nonce)
                .withPassphrase(wallets[16].passphrase)
                .build()[0];

            const transferTransaction = TransactionFactory.transfer("AFzQCx5YpGg5vKMBg4xbuYbqkhvMkKfKe5")
                .withNetwork("unitnet")
                .withNonce(nonce.plus(1))
                .withPassphrase(wallets[16].passphrase)
                .withSecondPassphrase(wallets[17].passphrase)
                .build()[0];

            let result = await processor.validate([secondSignatureTransaction.data]);
            expect(result.accept).not.toBeEmpty();
            expect(result.invalid).toBeEmpty();

            result = await processor.validate([transferTransaction.data]);
            expect(result.accept).toBeEmpty();
            expect(result.errors[transferTransaction.id]).toEqual([
                {
                    message: "Failed to apply transaction, because wallet does not allow second signatures.",
                    type: "ERR_APPLY",
                },
            ]);
        });

        describe("MultiSignature", () => {
            it("should accept multi signature registration with AIP11 milestone", async () => {
                const passphrases = [delegates[0].secret, delegates[1].secret, delegates[2].secret];
                const participants = passphrases.map(passphrase => Identities.PublicKey.fromPassphrase(passphrase));

                const multiSigRegistration = TransactionFactory.multiSignature(participants, 3)
                    .withNetwork("unitnet")
                    .withPassphrase(passphrases[0])
                    .withPassphraseList(passphrases)
                    .build()[0];

                const result = await processor.validate([multiSigRegistration.data]);
                expect(result.accept).not.toBeEmpty();
                expect(result.invalid).toBeEmpty();
            });

            it("should not accept multi signature registration without AIP11 milestone", async () => {
                const passphrases = [delegates[0].secret, delegates[3].secret, delegates[9].secret];
                const participants = passphrases.map(passphrase => Identities.PublicKey.fromPassphrase(passphrase));

                const multiSigRegistration = TransactionFactory.multiSignature(participants, 3)
                    .withNetwork("unitnet")
                    .withPassphrase(passphrases[0])
                    .withPassphraseList(passphrases)
                    .build()[0];

                Managers.configManager.getMilestone().aip11 = false;
                const result = await processor.validate([multiSigRegistration.data]);
                expect(result.errors[multiSigRegistration.id]).toEqual([
                    {
                        message: "Version 2 not supported.",
                        type: "ERR_UNKNOWN",
                    },
                ]);
                Managers.configManager.getMilestone().aip11 = true;
            });
        });

        describe("Sign a transaction then change some fields shouldn't pass validation", () => {
            it("should not validate when changing fields after signing - transfer", async () => {
                const sender = delegates[21];
                const notSender = delegates[22];

                // the fields we are going to modify after signing
                const modifiedFields = [
                    { nonce: 99 },
                    { amount: 111 },
                    { fee: 1111111 },
                    { recipientId: "ANqvJEMZcmUpcKBC8xiP1TntVkJeuZ3Lw3" },
                    // we are also going to modify senderPublicKey but separately
                ];

                // generate transfers, "simple" and 2nd signed
                const transfers = TransactionFactory.transfer("AFzQCx5YpGg5vKMBg4xbuYbqkhvMkKfKe5", 50)
                    .withNetwork("unitnet")
                    .withPassphrase(sender.secret)
                    .create(modifiedFields.length + 1); // + 1 because we will use it to modify senderPublicKey separately
                const transfers2ndSigned = TransactionFactory.transfer("AFzQCx5YpGg5vKMBg4xbuYbqkhvMkKfKe5", 50)
                    .withNetwork("unitnet")
                    .withPassphrasePair(wallets2ndSig[0])
                    .create(modifiedFields.length + 1); // + 1 because we will use it to modify senderPublicKey separately

                // modify transaction fields and try to validate
                const modifiedTransactions = [
                    ...modifiedFields.map((objField, index) => Object.assign({}, transfers[index], objField)),
                    Object.assign({}, transfers[transfers.length - 1], { senderPublicKey: notSender.publicKey }),
                    ...modifiedFields.map((objField, index) => Object.assign({}, transfers2ndSigned[index], objField)),
                    Object.assign({}, transfers2ndSigned[transfers2ndSigned.length - 1], {
                        senderPublicKey: wallets2ndSig[1].keys.publicKey,
                    }),
                ];
                const result = await processor.validate(modifiedTransactions);

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
                    {
                        nonce: 111111,
                    },
                    {
                        fee: 1111111,
                    },
                    // we are also going to modify senderPublicKey but separately
                ];

                // generate delegate registrations, "simple" and 2nd signed
                const delegateRegs = [];
                for (const wallet of wallets.slice(0, modifiedFieldsDelReg.length + 1)) {
                    delegateRegs.push(
                        TransactionFactory.delegateRegistration()
                            .withNetwork("unitnet")
                            .withPassphrase(wallet.passphrase)
                            .create()[0],
                    );
                }

                const delegateRegs2ndSigned = [];
                for (const wallet of wallets2ndSig.slice(0, modifiedFieldsDelReg.length + 1)) {
                    delegateRegs2ndSigned.push(
                        TransactionFactory.delegateRegistration()
                            .withNetwork("unitnet")
                            .withPassphrasePair(wallet)
                            .create()[0],
                    );
                }

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
                const result = await processor.validate(modifiedTransactions);

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
                    { nonce: 111111 },
                    { fee: 1111111 },
                    // we are also going to modify senderPublicKey but separately
                ];

                // generate votes, "simple" and 2nd signed
                const votes = [];
                for (const wallet of wallets.slice(0, modifiedFieldsVote.length + 1)) {
                    votes.push(
                        TransactionFactory.vote(delegates[21].publicKey)
                            .withNetwork("unitnet")
                            .withPassphrase(wallet.passphrase)
                            .create()[0],
                    );
                }

                const votes2ndSigned = [];
                for (const wallet of wallets2ndSig.slice(0, modifiedFieldsVote.length + 1)) {
                    votes2ndSigned.push(
                        TransactionFactory.vote(delegates[21].publicKey)
                            .withNetwork("unitnet")
                            .withPassphrasePair(wallet)
                            .create()[0],
                    );
                }

                // modify transaction fields and try to validate
                const modifiedTransactions = [
                    ...modifiedFieldsVote.map((objField, index) => Object.assign({}, votes[index], objField)),
                    Object.assign({}, votes[votes.length - 1], { senderPublicKey: wallets[50].keys.publicKey }),
                    ...modifiedFieldsVote.map((objField, index) => Object.assign({}, votes2ndSigned[index], objField)),
                    Object.assign({}, votes2ndSigned[votes2ndSigned.length - 1], {
                        senderPublicKey: wallets2ndSig[50].keys.publicKey,
                    }),
                ];
                const result = await processor.validate(modifiedTransactions);

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
                    { nonce: 111111 },
                    { fee: 1111111 },
                    { senderPublicKey: wallets[50].keys.publicKey },
                ];

                const secondSigs = [];

                for (const wallet of wallets.slice(0, modifiedFields2ndSig.length)) {
                    secondSigs.push(
                        TransactionFactory.secondSignature(wallet.passphrase)
                            .withNetwork("unitnet")
                            .withPassphrase(wallet.passphrase)
                            .create()[0],
                    );
                }

                const modifiedTransactions = modifiedFields2ndSig.map((objField, index) =>
                    Object.assign({}, secondSigs[index], objField),
                );
                const result = await processor.validate(modifiedTransactions);

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

            const addBlock = async (generatorKeys: any, transactions: Interfaces.ITransactionData[]) => {
                const timestamp = () => {
                    const lastBlock = blockchain.state.getLastBlock();
                    return Crypto.Slots.getSlotTime(Crypto.Slots.getSlotNumber(lastBlock.data.timestamp) + 1);
                };

                const transactionData = {
                    amount: Utils.BigNumber.ZERO,
                    fee: Utils.BigNumber.ZERO,
                    ids: [],
                };

                for (const transaction of transactions) {
                    transactionData.amount = transactionData.amount.plus(transaction.amount);
                    transactionData.fee = transactionData.fee.plus(transaction.fee);
                    transactionData.ids.push(Buffer.from(transaction.id, "hex"));
                }

                const lastBlock = blockchain.state.getLastBlock();
                const data = {
                    timestamp: timestamp(),
                    version: 0,
                    previousBlock: lastBlock.data.id,
                    previousBlockHex: lastBlock.data.idHex,
                    height: lastBlock.data.height + 1,
                    numberOfTransactions: transactions.length,
                    totalAmount: transactionData.amount,
                    totalFee: transactionData.fee,
                    reward: Utils.BigNumber.ZERO,
                    payloadLength: 32 * transactions.length,
                    payloadHash: Crypto.HashAlgorithms.sha256(transactionData.ids).toString("hex"),
                    transactions,
                };

                const blockInstance = Blocks.BlockFactory.make(
                    data,
                    Identities.Keys.fromPassphrase(generatorKeys.secret),
                );

                await blockchain.processBlocks(
                    [
                        {
                            ...blockInstance.data,
                            transactions: blockInstance.transactions.map(tx => tx.data),
                        },
                    ],
                    () => undefined,
                );
            };

            it("should not validate an already forged transaction", async () => {
                const transfers = TransactionFactory.transfer(wallets[1].address, 11)
                    .withNetwork("unitnet")
                    .withPassphrase(wallets[0].passphrase)
                    .create();

                const forgerKeys = delegates[0];
                await addBlock(forgerKeys, transfers);

                const result = await processor.validate(transfers);

                expect(result.errors).toContainKey(transfers[0].id);
                expect(result.errors[transfers[0].id][0].message).toStartWith("Already forged");
                expect(result.errors[transfers[0].id][0].type).toEqual("ERR_FORGED");
            });

            it("should not validate an already forged transaction - trying to tweak tx id", async () => {
                const transfers = TransactionFactory.transfer(wallets[1].address, 11)
                    .withNetwork("unitnet")
                    .withPassphrase(wallets[0].passphrase)
                    .create();

                const forgerKeys = delegates[0];
                await addBlock(forgerKeys, transfers);

                const originalId: string = transfers[0].id;

                transfers[0].id = "c".repeat(64);

                const result = await processor.validate(transfers);

                expect(result.errors).toContainKey(originalId);
                expect(result.errors[originalId][0].message).toStartWith("Already forged");
                expect(result.errors[originalId][0].type).toEqual("ERR_FORGED");
            });
        });

        describe("Expiration", () => {
            it("should accept expiring transactions", async () => {
                const store = container.resolvePlugin<State.IStateService>("state").getStore();

                const spy = jest.spyOn(store, "getLastHeight").mockReturnValue(100);

                const transferTransaction = TransactionFactory.transfer("AFzQCx5YpGg5vKMBg4xbuYbqkhvMkKfKe5")
                    .withNetwork("unitnet")
                    .withPassphrase(wallets[13].passphrase)
                    .withExpiration(102)
                    .build()[0];

                const transferTransaction2 = TransactionFactory.transfer("AFzQCx5YpGg5vKMBg4xbuYbqkhvMkKfKe5")
                    .withNetwork("unitnet")
                    .withPassphrase(wallets[12].passphrase)
                    .withExpiration(0)
                    .build()[0];

                const result = await processor.validate([transferTransaction.data, transferTransaction2.data]);

                expect(result.accept).toEqual([transferTransaction.id, transferTransaction2.id]);
                expect(result.broadcast).toEqual([transferTransaction.id, transferTransaction2.id]);
                expect(result.errors).toBeUndefined();

                spy.mockRestore();
            });

            it("should reject expired transactions", async () => {
                const store = container.resolvePlugin<State.IStateService>("state").getStore();

                const spy = jest.spyOn(store, "getLastHeight").mockReturnValue(100);

                const transferTransaction = TransactionFactory.transfer("AFzQCx5YpGg5vKMBg4xbuYbqkhvMkKfKe5")
                    .withNetwork("unitnet")
                    .withPassphrase(wallets[16].passphrase)
                    .withExpiration(50)
                    .build()[0];

                const transferTransaction2 = TransactionFactory.transfer("AFzQCx5YpGg5vKMBg4xbuYbqkhvMkKfKe5")
                    .withNetwork("unitnet")
                    .withPassphrase(wallets[15].passphrase)
                    .withExpiration(100)
                    .build()[0];

                const result = await processor.validate([transferTransaction.data, transferTransaction2.data]);

                expect(result.errors[transferTransaction.id]).toEqual([
                    {
                        message: `Transaction ${transferTransaction.id} is expired since ${100 -
                            transferTransaction.data.expiration} blocks.`,
                        type: "ERR_EXPIRED",
                    },
                ]);

                expect(result.errors[transferTransaction2.id]).toEqual([
                    {
                        message: `Transaction ${transferTransaction2.id} is expired since ${100 -
                            transferTransaction2.data.expiration} blocks.`,
                        type: "ERR_EXPIRED",
                    },
                ]);

                spy.mockRestore();
            });
        });
    });

    describe("__cacheTransactions", () => {
        it("should add transactions to cache", async () => {
            const transactions = TransactionFactory.transfer(wallets[11].address, 35)
                .withNetwork("unitnet")
                .withPassphrase(wallets[10].passphrase)
                .build();

            await processor.validate(transactions.map(tx => tx.data));

            expect(processor.getTransactions()).toEqual(transactions.map(tx => tx.data));
        });

        it("should not add a transaction already in cache and add it as an error", async () => {
            const transactions = TransactionFactory.transfer(wallets[12].address, 35)
                .withNetwork("unitnet")
                .withPassphrase(wallets[11].passphrase)
                .build();

            processor.validate(transactions.map(tx => tx.data));
            await expect(processor.validate([transactions[0].data])).resolves.toHaveProperty("errors", {
                [transactions[0].id]: [
                    {
                        message: "Already in cache.",
                        type: "ERR_DUPLICATE",
                    },
                ],
            });
        });
    });

    // @TODO: review and remove tests that are no longer needed.
    // Those used to be unit tests but their behaviour is already covered by integration tests.

    // describe("__cacheTransactions", () => {
    //     it("should add transactions to cache", () => {
    //         const transactions = TransactionFactory.transfer(wallets[11].address, 35)
    //             .withNetwork("unitnet")
    //             .withPassphrase(wallets[10].passphrase)
    //             .create(3);
    //         jest.spyOn(state, "cacheTransactions").mockReturnValueOnce({ added: transactions, notAdded: [] });

    //         expect(processor.__cacheTransactions(transactions)).toEqual(transactions);
    //     });

    //     it("should not add a transaction already in cache and add it as an error", () => {
    //         const transactions = TransactionFactory.transfer(wallets[12].address, 35)
    //             .withNetwork("unitnet")
    //             .withPassphrase(wallets[11].passphrase)
    //             .create(3);

    //         jest.spyOn(state, "cacheTransactions")
    //             .mockReturnValueOnce({ added: transactions, notAdded: [] })
    //             .mockReturnValueOnce({ added: [], notAdded: [transactions[0]] });

    //         expect(processor.__cacheTransactions(transactions)).toEqual(transactions);
    //         expect(processor.__cacheTransactions([transactions[0]])).toEqual([]);
    //         expect(processor.errors).toEqual({
    //             [transactions[0].id]: [
    //                 {
    //                     message: "Already in cache.",
    //                     type: "ERR_DUPLICATE",
    //                 },
    //             ],
    //         });
    //     });
    // });

    // describe("getBroadcastTransactions", () => {
    //     it("should return broadcast transaction", async () => {
    //         const transactions = TransactionFactory.transfer(wallets[11].address, 25)
    //             .withNetwork("unitnet")
    //             .withPassphrase(wallets[10].passphrase)
    //             .build(3);

    //         jest.spyOn(state, "cacheTransactions").mockReturnValueOnce({ added: transactions, notAdded: [] });

    //         for (const tx of transactions) {
    //             processor.broadcast.set(tx.id, tx);
    //         }

    //         expect(processor.getBroadcastTransactions()).toEqual(transactions);
    //     });
    // });

    // describe("__filterAndTransformTransactions", () => {
    //     it("should reject duplicate transactions", () => {
    //         const transactionExists = processor.pool.transactionExists;
    //         processor.pool.transactionExists = jest.fn(() => true);

    //         const tx = { id: "1" };
    //         processor.__filterAndTransformTransactions([tx]);

    //         expect(processor.errors[tx.id]).toEqual([
    //             {
    //                 message: `Duplicate transaction ${tx.id}`,
    //                 type: "ERR_DUPLICATE",
    //             },
    //         ]);

    //         processor.pool.transactionExists = transactionExists;
    //     });

    //     it("should reject transactions that are too large", () => {
    //         const tx = TransactionFactory.transfer(wallets[12].address)
    //             .withNetwork("unitnet")
    //             .withPassphrase(wallets[11].passphrase)
    //             .build(3)[0];

    //         // @FIXME: Uhm excuse me, what the?
    //         tx.data.signatures = [""];
    //         for (let i = 0; i < transactionPool.options.maxTransactionBytes; i++) {
    //             // @ts-ignore
    //             tx.data.signatures += "1";
    //         }
    //         processor.__filterAndTransformTransactions([tx]);

    //         expect(processor.errors[tx.id]).toEqual([
    //             {
    //                 message: `Transaction ${tx.id} is larger than ${
    //                     transactionPool.options.maxTransactionBytes
    //                 } bytes.`,
    //                 type: "ERR_TOO_LARGE",
    //             },
    //         ]);
    //     });

    //     it("should reject transactions from the future", () => {
    //         const now = 47157042; // seconds since genesis block
    //         const transactionExists = processor.pool.transactionExists;
    //         processor.pool.transactionExists = jest.fn(() => false);
    //         const getTime = Crypto.Slots.getTime;
    //         Crypto.Slots.getTime = jest.fn(() => now);

    //         const secondsInFuture = 3601;
    //         const tx = {
    //             id: "1",
    //             senderPublicKey: "affe",
    //             timestamp: Crypto.Slots.getTime() + secondsInFuture,
    //         };
    //         processor.__filterAndTransformTransactions([tx]);

    //         expect(processor.errors[tx.id]).toEqual([
    //             {
    //                 message: `Transaction ${tx.id} is ${secondsInFuture} seconds in the future`,
    //                 type: "ERR_FROM_FUTURE",
    //             },
    //         ]);

    //         Crypto.Slots.getTime = getTime;
    //         processor.pool.transactionExists = transactionExists;
    //     });

    //     it("should accept transaction with correct network byte", () => {
    //         const transactionExists = processor.pool.transactionExists;
    //         processor.pool.transactionExists = jest.fn(() => false);

    //         const canApply = processor.pool.walletManager.canApply;
    //         processor.pool.walletManager.canApply = jest.fn(() => true);

    //         const tx = {
    //             id: "1",
    //             network: 23,
    //             type: Enums.TransactionType.Transfer,
    //             senderPublicKey: "023ee98f453661a1cb765fd60df95b4efb1e110660ffb88ae31c2368a70f1f7359",
    //             recipientId: "DEJHR83JFmGpXYkJiaqn7wPGztwjheLAmY",
    //         };
    //         processor.__filterAndTransformTransactions([tx]);

    //         expect(processor.errors[tx.id]).not.toEqual([
    //             {
    //                 message: `Transaction network '${tx.network}' does not match '${Managers.configManager.get(
    //                     "pubKeyHash",
    //                 )}'`,
    //                 type: "ERR_WRONG_NETWORK",
    //             },
    //         ]);

    //         processor.pool.transactionExists = transactionExists;
    //         processor.pool.walletManager.canApply = canApply;
    //     });

    //     it("should accept transaction with missing network byte", () => {
    //         const transactionExists = processor.pool.transactionExists;
    //         processor.pool.transactionExists = jest.fn(() => false);

    //         const canApply = processor.pool.walletManager.canApply;
    //         processor.pool.walletManager.canApply = jest.fn(() => true);

    //         const tx = {
    //             id: "1",
    //             type: Enums.TransactionType.Transfer,
    //             senderPublicKey: "023ee98f453661a1cb765fd60df95b4efb1e110660ffb88ae31c2368a70f1f7359",
    //             recipientId: "DEJHR83JFmGpXYkJiaqn7wPGztwjheLAmY",
    //         };
    //         processor.__filterAndTransformTransactions([tx]);

    //         expect(processor.errors[tx.id].type).not.toEqual("ERR_WRONG_NETWORK");

    //         processor.pool.transactionExists = transactionExists;
    //         processor.pool.walletManager.canApply = canApply;
    //     });

    //     it("should not accept transaction with wrong network byte", () => {
    //         const transactionExists = processor.pool.transactionExists;
    //         processor.pool.transactionExists = jest.fn(() => false);

    //         const canApply = processor.pool.walletManager.canApply;
    //         processor.pool.walletManager.canApply = jest.fn(() => true);

    //         const tx = {
    //             id: "1",
    //             network: 2,
    //             senderPublicKey: "023ee98f453661a1cb765fd60df95b4efb1e110660ffb88ae31c2368a70f1f7359",
    //         };
    //         processor.__filterAndTransformTransactions([tx]);

    //         expect(processor.errors[tx.id]).toEqual([
    //             {
    //                 message: `Transaction network '${tx.network}' does not match '${Managers.configManager.get(
    //                     "pubKeyHash",
    //                 )}'`,
    //                 type: "ERR_WRONG_NETWORK",
    //             },
    //         ]);

    //         processor.pool.transactionExists = transactionExists;
    //         processor.pool.walletManager.canApply = canApply;
    //     });

    //     it("should not accept transaction if pool hasExceededMaxTransactions and add it to excess", () => {
    //         const transactions = TransactionFactory.transfer(wallets[11].address, 35)
    //             .withNetwork("unitnet")
    //             .withPassphrase(wallets[10].passphrase)
    //             .create(3);

    //         jest.spyOn(processor.pool, "hasExceededMaxTransactions").mockImplementationOnce(senderPublicKey => true);

    //         processor.__filterAndTransformTransactions(transactions);

    //         expect(processor.excess).toEqual([transactions[0].id]);
    //         expect(processor.accept).toEqual(new Map());
    //         expect(processor.broadcast).toEqual(new Map());
    //     });

    //     it("should push a ERR_UNKNOWN error if something threw in validated transaction block", () => {
    //         const transactions = TransactionFactory.transfer(wallets[11].address, 35)
    //             .withNetwork("unitnet")
    //             .withPassphrase(wallets[10].passphrase)
    //             .build(3);

    //         // use processor.accept.set() call to introduce a throw
    //         jest.spyOn(processor.pool.walletManager, "canApply").mockImplementationOnce(() => {
    //             throw new Error("hey");
    //         });

    //         processor.__filterAndTransformTransactions(transactions.map(tx => tx.data));

    //         expect(processor.accept).toEqual(new Map());
    //         expect(processor.broadcast).toEqual(new Map());
    //         expect(processor.errors[transactions[0].id]).toEqual([
    //             {
    //                 message: `hey`,
    //                 type: "ERR_UNKNOWN",
    //             },
    //         ]);
    //     });
    // });

    // describe("__validateTransaction", () => {
    //     it("should not validate when recipient is not on the same network", async () => {
    //         const transactions = TransactionFactory.transfer("DEJHR83JFmGpXYkJiaqn7wPGztwjheLAmY", 35)
    //             .withNetwork("unitnet")
    //             .withPassphrase(wallets[10].passphrase)
    //             .create(3);

    //         expect(processor.__validateTransaction(transactions[0])).toBeFalse();
    //         expect(processor.errors).toEqual({
    //             [transactions[0].id]: [
    //                 {
    //                     type: "ERR_INVALID_RECIPIENT",
    //                     message: `Recipient ${
    //                         transactions[0].recipientId
    //                     } is not on the same network: ${Managers.configManager.get("network.pubKeyHash")}`,
    //                 },
    //             ],
    //         });
    //     });

    //     it("should not validate a delegate registration if an existing registration for the same username from a different wallet exists in the pool", async () => {
    //         const delegateRegistrations = [
    //             TransactionFactory.delegateRegistration("test_delegate")
    //                 .withNetwork("unitnet")
    //                 .withPassphrase(wallets[16].passphrase)
    //                 .build()[0],
    //             TransactionFactory.delegateRegistration("test_delegate")
    //                 .withNetwork("unitnet")
    //                 .withPassphrase(wallets[17].passphrase)
    //                 .build()[0],
    //         ];
    //         const memPoolTx = new MemPoolTransaction(delegateRegistrations[0]);
    //         jest.spyOn(processor.pool, "getTransactionsByType").mockReturnValueOnce(new Set([memPoolTx]));

    //         expect(processor.__validateTransaction(delegateRegistrations[1].data)).toBeFalse();
    //         expect(processor.errors[delegateRegistrations[1].id]).toEqual([
    //             {
    //                 type: "ERR_PENDING",
    //                 message: `Delegate registration for "${
    //                     delegateRegistrations[1].data.asset.delegate.username
    //                 }" already in the pool`,
    //             },
    //         ]);
    //     });

    //     it("should not validate when sender has same type transactions in the pool (only for 2nd sig, delegate registration, vote)", async () => {
    //         jest.spyOn(processor.pool.walletManager, "canApply").mockImplementation(() => true);
    //         jest.spyOn(processor.pool, "senderHasTransactionsOfType").mockReturnValue(true);
    //         const vote = TransactionFactory.vote(delegates[0].publicKey)
    //             .withNetwork("unitnet")
    //             .withPassphrase(wallets[10].passphrase)
    //             .build()[0];

    //         const delegateReg = TransactionFactory.delegateRegistration()
    //             .withNetwork("unitnet")
    //             .withPassphrase(wallets[11].passphrase)
    //             .build()[0];

    //         const signature = TransactionFactory.secondSignature(wallets[12].passphrase)
    //             .withNetwork("unitnet")
    //             .withPassphrase(wallets[12].passphrase)
    //             .build()[0];

    //         for (const tx of [vote, delegateReg, signature]) {
    //             expect(processor.__validateTransaction(tx.data)).toBeFalse();
    //             expect(processor.errors[tx.id]).toEqual([
    //                 {
    //                     type: "ERR_PENDING",
    //                     message:
    //                         `Sender ${tx.data.senderPublicKey} already has a transaction of type ` +
    //                         `'${Enums.TransactionType[tx.type]}' in the pool`,
    //                 },
    //             ]);
    //         }

    //         jest.restoreAllMocks();
    //     });

    //     it("should not validate unsupported transaction types", async () => {
    //         jest.spyOn(processor.pool.walletManager, "canApply").mockImplementation(() => true);

    //         // use a random transaction as a base - then play with type
    //         const baseTransaction = TransactionFactory.delegateRegistration()
    //             .withNetwork("unitnet")
    //             .withPassphrase(wallets[11].passphrase)
    //             .build()[0];

    //         for (const transactionType of [
    //             Enums.TransactionType.MultiSignature,
    //             Enums.TransactionType.Ipfs,
    //             Enums.TransactionType.MultiPayment,
    //             Enums.TransactionType.DelegateResignation,
    //             99,
    //         ]) {
    //             baseTransaction.data.type = transactionType;
    //             // @FIXME: Uhm excuse me, what the?
    //             // @ts-ignore
    //             baseTransaction.data.id = transactionType;

    //             expect(processor.__validateTransaction(baseTransaction)).toBeFalse();
    //             expect(processor.errors[baseTransaction.id]).toEqual([
    //                 {
    //                     type: "ERR_UNSUPPORTED",
    //                     message: `Invalidating transaction of unsupported type '${
    //                         Enums.TransactionType[transactionType]
    //                     }'`,
    //                 },
    //             ]);
    //         }

    //         jest.restoreAllMocks();
    //     });
    // });

    // describe("__removeForgedTransactions", () => {
    //     it("should remove forged transactions", async () => {
    //         const transfers = TransactionFactory.transfer(delegates[0].senderPublicKey)
    //             .withNetwork("unitnet")
    //             .withPassphrase(delegates[0].secret)
    //             .build(4);

    //         transfers.forEach(tx => {
    //             processor.accept.set(tx.id, tx);
    //             processor.broadcast.set(tx.id, tx);
    //         });

    //         const forgedTx = transfers[2];
    //         jest.spyOn(database, "getForgedTransactionsIds").mockReturnValueOnce([forgedTx.id]);

    //         await processor.__removeForgedTransactions();

    //         expect(processor.accept.size).toBe(3);
    //         expect(processor.broadcast.size).toBe(3);

    //         expect(processor.errors[forgedTx.id]).toHaveLength(1);
    //         expect(processor.errors[forgedTx.id][0].type).toEqual("ERR_FORGED");
    //     });
    // });

    // describe("__addTransactionsToPool", () => {
    //     it("should add transactions to the pool", () => {
    //         const transfers = TransactionFactory.transfer(delegates[0].senderPublicKey)
    //             .withNetwork("unitnet")
    //             .withPassphrase(delegates[0].secret)
    //             .create(4);

    //         transfers.forEach(tx => {
    //             processor.accept.set(tx.id, tx);
    //             processor.broadcast.set(tx.id, tx);
    //         });

    //         expect(processor.errors).toEqual({});
    //         jest.spyOn(processor.pool, "addTransactions").mockReturnValueOnce({ added: transfers, notAdded: [] });

    //         processor.__addTransactionsToPool();

    //         expect(processor.errors).toEqual({});
    //         expect(processor.accept.size).toBe(4);
    //         expect(processor.broadcast.size).toBe(4);
    //     });

    //     it("should delete from accept and broadcast transactions that were not added to the pool", () => {
    //         const added = TransactionFactory.transfer(delegates[0].address)
    //             .withNetwork("unitnet")
    //             .withPassphrase(delegates[0].secret)
    //             .build(2);
    //         const notAddedError = { type: "ERR_TEST", message: "" };
    //         const notAdded = TransactionFactory.transfer(delegates[1].address)
    //             .withNetwork("unitnet")
    //             .withPassphrase(delegates[0].secret)
    //             .build(2)
    //             .map(tx => ({
    //                 transaction: tx,
    //                 ...notAddedError,
    //             }));

    //         added.forEach(tx => {
    //             processor.accept.set(tx.id, tx);
    //             processor.broadcast.set(tx.id, tx);
    //         });
    //         notAdded.forEach(tx => {
    //             processor.accept.set(tx.transaction.id, tx);
    //             processor.broadcast.set(tx.transaction.id, tx);
    //         });

    //         jest.spyOn(processor.pool, "addTransactions").mockReturnValueOnce({ added, notAdded });
    //         processor.__addTransactionsToPool();

    //         expect(processor.accept.size).toBe(2);
    //         expect(processor.broadcast.size).toBe(2);

    //         expect(processor.errors[notAdded[0].transaction.id]).toEqual([notAddedError]);
    //         expect(processor.errors[notAdded[1].transaction.id]).toEqual([notAddedError]);
    //     });

    //     it("should delete from accept but keep in broadcast transactions that were not added to the pool because of ERR_POOL_FULL", () => {
    //         const added = TransactionFactory.transfer(delegates[0].address)
    //             .withNetwork("unitnet")
    //             .withPassphrase(delegates[0].secret)
    //             .build(2);

    //         const notAddedError = { type: "ERR_POOL_FULL", message: "" };
    //         const notAdded = TransactionFactory.transfer(delegates[1].address)
    //             .withNetwork("unitnet")
    //             .withPassphrase(delegates[0].secret)
    //             .build(2)
    //             .map(tx => ({
    //                 transaction: tx,
    //                 ...notAddedError,
    //             }));

    //         added.forEach(tx => {
    //             processor.accept.set(tx.id, tx);
    //             processor.broadcast.set(tx.id, tx);
    //         });
    //         notAdded.forEach(tx => {
    //             processor.accept.set(tx.transaction.id, tx);
    //             processor.broadcast.set(tx.transaction.id, tx);
    //         });

    //         jest.spyOn(processor.pool, "addTransactions").mockReturnValueOnce({ added, notAdded });
    //         processor.__addTransactionsToPool();

    //         expect(processor.accept.size).toBe(2);
    //         expect(processor.broadcast.size).toBe(4);

    //         expect(processor.errors[notAdded[0].transaction.id]).toEqual([notAddedError]);
    //         expect(processor.errors[notAdded[1].transaction.id]).toEqual([notAddedError]);
    //     });
    // });

    // describe("pushError", () => {
    //     it("should have error for transaction", () => {
    //         expect(processor.errors).toBeEmpty();

    //         processor.pushError({ id: 1 }, "ERR_INVALID", "Invalid.");

    //         expect(processor.errors).toBeObject();
    //         expect(processor.errors["1"]).toBeArray();
    //         expect(processor.errors["1"]).toHaveLength(1);
    //         expect(processor.errors["1"]).toEqual([{ message: "Invalid.", type: "ERR_INVALID" }]);

    //         expect(processor.invalid.size).toEqual(1);
    //         expect(processor.invalid.entries().next().value[1]).toEqual({ id: 1 });
    //     });

    //     it("should have multiple errors for transaction", () => {
    //         expect(processor.errors).toBeEmpty();

    //         processor.pushError({ id: 1 }, "ERR_INVALID", "Invalid 1.");
    //         processor.pushError({ id: 1 }, "ERR_INVALID", "Invalid 2.");

    //         expect(processor.errors).toBeObject();
    //         expect(processor.errors["1"]).toBeArray();
    //         expect(processor.errors["1"]).toHaveLength(2);
    //         expect(processor.errors["1"]).toEqual([
    //             { message: "Invalid 1.", type: "ERR_INVALID" },
    //             { message: "Invalid 2.", type: "ERR_INVALID" },
    //         ]);

    //         expect(processor.invalid.size).toEqual(1);
    //         expect(processor.invalid.entries().next().value[1]).toEqual({ id: 1 });
    //     });
    // });
});
