import "jest-extended";

import { Wallet, WalletManager } from "@arkecosystem/core-database";
import { Database } from "@arkecosystem/core-interfaces";
import { Constants, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import {
    AlreadyVotedError,
    InsufficientBalanceError,
    InvalidMultiSignatureError,
    InvalidSecondSignatureError,
    MultiSignatureAlreadyRegisteredError,
    MultiSignatureKeyCountMismatchError,
    MultiSignatureMinimumKeysError,
    NoVoteError,
    SecondSignatureAlreadyRegisteredError,
    SenderWalletMismatchError,
    UnexpectedSecondSignatureError,
    UnvoteMismatchError,
    WalletNoUsernameError,
    WalletUsernameNotEmptyError,
} from "../../../packages/core-transactions/src/errors";
import { TransactionHandler } from "../../../packages/core-transactions/src/handlers/transaction";
import { TransactionHandlerRegistry } from "../../../packages/core-transactions/src/index";
import { TransactionFactory } from "../../helpers";
import { transaction as transactionFixture } from "../crypto/transactions/__fixtures__/transaction";
import { wallet as walletFixture } from "../crypto/transactions/__fixtures__/wallet";

let wallet: Wallet;
let transaction: Interfaces.ITransactionData;
let transactionWithSecondSignature: Interfaces.ITransactionData;
let handler: TransactionHandler;
let instance: Interfaces.ITransaction;
let walletManager: Database.IWalletManager;

beforeEach(() => {
    walletManager = new WalletManager();

    wallet = {
        address: "D5q7YfEFDky1JJVQQEy4MGyiUhr5cGg47F",
        balance: Utils.BigNumber.make(4527654310),
        publicKey: "02a47a2f594635737d2ce9898680812ff7fa6aaa64ddea1360474c110e9985a087",
    } as Wallet;

    walletManager.reindex(wallet);

    transaction = {
        id: "65a4f09a3a19d212a65d27de05d1ae7e0c461e088a35499996667f98d2a3897c",
        signature:
            "304402206974568da7c363155decbc20ddc17746a2e7e663901c426f5a41411374cc6d18022052f4353ec93227713f9907f2bb2549e6bc42584b736aa5f9ff36e2c239154648",
        timestamp: 54836734,
        type: 0,
        fee: Utils.BigNumber.make(10000000),
        senderPublicKey: "02a47a2f594635737d2ce9898680812ff7fa6aaa64ddea1360474c110e9985a087",
        amount: Utils.BigNumber.make(10000000),
        recipientId: "D5q7YfEFDky1JJVQQEy4MGyiUhr5cGg47F",
    };

    transactionWithSecondSignature = {
        id: "e3b29bba60d5f1f2aad2087dea44644f166b00ae3db1a16a99b622dc4f3900f8",
        signature:
            "304402206974568da7c363155decbc20ddc17746a2e7e663901c426f5a41411374cc6d18022052f4353ec93227713f9907f2bb2549e6bc42584b736aa5f9ff36e2c239154648",
        secondSignature:
            "304402202d0ae57c6a0afb225443b56c6e049cb08df48b5813362f7e11574b96f225738f0220055b5a941cc70100404a7788c57b37e2e806acf58c4284c567dc53477f546540",
        timestamp: 54836734,
        type: 0,
        fee: Utils.BigNumber.make(10000000),
        senderPublicKey: "02a47a2f594635737d2ce9898680812ff7fa6aaa64ddea1360474c110e9985a087",
        amount: Utils.BigNumber.make(10000000),
        recipientId: "D5q7YfEFDky1JJVQQEy4MGyiUhr5cGg47F",
    };
});

describe("General Tests", () => {
    beforeEach(() => {
        handler = TransactionHandlerRegistry.get(transaction.type);
        instance = Transactions.TransactionFactory.fromData(transaction);
    });

    describe("canBeApplied", () => {
        it("should be true", () => {
            expect(handler.canBeApplied(instance, wallet, walletManager)).toBeTrue();
        });

        it("should be true if the transaction has a second signature but wallet does not, when ignoreInvalidSecondSignatureField=true", () => {
            Managers.configManager.getMilestone().ignoreInvalidSecondSignatureField = true;
            instance = Transactions.TransactionFactory.fromData(transactionWithSecondSignature);
            expect(handler.canBeApplied(instance, wallet, walletManager)).toBeTrue();
        });

        it("should be false if wallet publicKey does not match tx senderPublicKey", () => {
            instance.data.senderPublicKey = "a".repeat(66);
            expect(() => handler.canBeApplied(instance, wallet, walletManager)).toThrow(SenderWalletMismatchError);
        });

        it("should be false if the transaction has a second signature but wallet does not", () => {
            delete Managers.configManager.getMilestone().ignoreInvalidSecondSignatureField;
            instance = Transactions.TransactionFactory.fromData(transactionWithSecondSignature);
            expect(() => handler.canBeApplied(instance, wallet, walletManager)).toThrow(UnexpectedSecondSignatureError);
        });

        it("should be false if the wallet has a second public key but the transaction second signature does not match", () => {
            wallet.secondPublicKey = "invalid-public-key";
            expect(() => handler.canBeApplied(instance, wallet, walletManager)).toThrow(InvalidSecondSignatureError);
        });

        it("should be false if wallet has not enough balance", () => {
            // 1 arktoshi short
            wallet.balance = transaction.amount.plus(transaction.fee).minus(1);
            expect(() => handler.canBeApplied(instance, wallet, walletManager)).toThrow(InsufficientBalanceError);
        });

        it("should be true even with publicKey case mismatch", () => {
            transaction.senderPublicKey = transaction.senderPublicKey.toUpperCase();
            wallet.publicKey = wallet.publicKey.toLowerCase();
            instance = Transactions.TransactionFactory.fromData(transaction);
            expect(handler.canBeApplied(instance, wallet, walletManager)).toBeTrue();
        });
    });

    describe("applyTransactionToSender", () => {
        it("should be ok", () => {
            const initialBalance = 1000 * Constants.ARKTOSHI;
            wallet.balance = Utils.BigNumber.make(initialBalance);
            handler.applyToSender(instance, wallet);
            expect(wallet.balance).toEqual(
                Utils.BigNumber.make(initialBalance)
                    .minus(transaction.amount)
                    .minus(transaction.fee),
            );
        });

        it("should not be ok", () => {
            const initialBalance = 1000 * Constants.ARKTOSHI;
            wallet.balance = Utils.BigNumber.make(initialBalance);
            instance.data.senderPublicKey = "a".repeat(66);

            handler.applyToSender(instance, wallet);
            expect(wallet.balance).toEqual(Utils.BigNumber.make(initialBalance));
        });

        it("should not fail due to case mismatch", () => {
            const initialBalance = 1000 * Constants.ARKTOSHI;
            wallet.balance = Utils.BigNumber.make(initialBalance);

            transaction.senderPublicKey = transaction.senderPublicKey.toUpperCase();
            const instance = Transactions.TransactionFactory.fromData(transaction);
            wallet.publicKey = wallet.publicKey.toLowerCase();

            handler.applyToSender(instance, wallet);
            expect(wallet.balance).toEqual(
                Utils.BigNumber.make(initialBalance)
                    .minus(transaction.amount)
                    .minus(transaction.fee),
            );
        });
    });

    describe("revertTransactionForSender", () => {
        it("should be ok", () => {
            const initialBalance = 1000 * Constants.ARKTOSHI;
            wallet.balance = Utils.BigNumber.make(initialBalance);

            handler.revertForSender(instance, wallet);
            expect(wallet.balance).toEqual(
                Utils.BigNumber.make(initialBalance)
                    .plus(transaction.amount)
                    .plus(transaction.fee),
            );
        });

        it("should not be ok", () => {
            const initialBalance = 1000 * Constants.ARKTOSHI;
            wallet.balance = Utils.BigNumber.make(initialBalance);
            transaction.senderPublicKey = "a".repeat(66);

            handler.revertForSender(instance, wallet);
            expect(wallet.balance).toEqual(Utils.BigNumber.make(initialBalance));
        });
    });

    describe("applyTransactionToRecipient", () => {
        it("should be ok", () => {
            const initialBalance = 1000 * Constants.ARKTOSHI;
            wallet.balance = Utils.BigNumber.make(initialBalance);

            handler.applyToRecipient(instance, wallet);
            expect(wallet.balance).toEqual(Utils.BigNumber.make(initialBalance).plus(transaction.amount));
        });

        it("should not be ok", () => {
            const initialBalance = 1000 * Constants.ARKTOSHI;
            wallet.balance = Utils.BigNumber.make(initialBalance);
            transaction.recipientId = "invalid-recipientId";

            handler.applyToRecipient(instance, wallet);
            expect(wallet.balance).toEqual(Utils.BigNumber.make(initialBalance));
        });
    });

    describe("revertTransactionForRecipient", () => {
        it("should be ok", () => {
            const initialBalance = 1000 * Constants.ARKTOSHI;
            wallet.balance = Utils.BigNumber.make(initialBalance);

            handler.revertForRecipient(instance, wallet);
            expect(wallet.balance).toEqual(Utils.BigNumber.make(initialBalance).minus(transaction.amount));
        });

        it("should not be ok", () => {
            const initialBalance = 1000 * Constants.ARKTOSHI;
            wallet.balance = Utils.BigNumber.make(initialBalance);

            transaction.recipientId = "invalid-recipientId";

            handler.revertForRecipient(instance, wallet);
            expect(wallet.balance).toEqual(Utils.BigNumber.make(initialBalance));
        });
    });
});

describe("TransferTransaction", () => {
    beforeEach(() => {
        wallet = walletFixture;
        transaction = transactionFixture;
        handler = TransactionHandlerRegistry.get(transaction.type);
        instance = Transactions.TransactionFactory.fromData(transaction);
    });

    describe("canApply", () => {
        it("should be true", () => {
            expect(handler.canBeApplied(instance, wallet, walletManager)).toBeTrue();
        });

        it("should be false", () => {
            instance.data.senderPublicKey = "a".repeat(66);
            expect(() => handler.canBeApplied(instance, wallet, walletManager)).toThrow(SenderWalletMismatchError);
        });
    });
});

describe("SecondSignatureRegistrationTransaction", () => {
    beforeEach(() => {
        wallet = {
            address: "DSD9Wi2rfqzDb3REUB5MELQGrsUAjY67gj",
            balance: Utils.BigNumber.make("6453530000000"),
            publicKey: "03cba4fd60f856ad034ee0a9146432757ae35956b640c26fb6674061924b05a5c9",
            secondPublicKey: null,
        } as Wallet;

        transaction = {
            version: 1,
            network: 30,
            type: 1,
            timestamp: 53995738,
            senderPublicKey: "03cba4fd60f856ad034ee0a9146432757ae35956b640c26fb6674061924b05a5c9",
            fee: Utils.BigNumber.make(500000000),
            asset: {
                signature: {
                    publicKey: "02d5cfcbc4920d041d2a54b29e1f69173536796fd50f62af0f88ad6adc6df07cb8",
                },
            },
            signature:
                "3044022064e7abe87c186b201eaeeb9587097432816c94b52b85520a70da1d78b93456aa0220205e263a278c64771d46038f116c37dc16c86e73664e7e829951d7c5544c6d3e",
            amount: Utils.BigNumber.ZERO,
            recipientId: "DSD9Wi2rfqzDb3REUB5MELQGrsUAjY67gj",
            id: "e5a4cf622a24d459987f093e14a14c6b0492834358f86099afe1a2d14457cf31",
        };

        handler = TransactionHandlerRegistry.get(transaction.type);
        instance = Transactions.TransactionFactory.fromData(transaction);
    });

    describe("canApply", () => {
        it("should be true", () => {
            expect(handler.canBeApplied(instance, wallet, walletManager)).toBeTrue();
        });

        it("should be false if wallet already has a second signature", () => {
            wallet.secondPublicKey = "02d5cfcbc4920d041d2a54b29e1f69173536796fd50f62af0f88ad6adc6df07cb8";

            expect(() => handler.canBeApplied(instance, wallet, walletManager)).toThrow(
                SecondSignatureAlreadyRegisteredError,
            );
        });

        it("should be false if wallet has insufficient funds", () => {
            wallet.balance = Utils.BigNumber.ZERO;

            expect(() => handler.canBeApplied(instance, wallet, walletManager)).toThrow(InsufficientBalanceError);
        });
    });

    describe("apply", () => {
        it("should apply second signature registration", () => {
            expect(handler.canBeApplied(instance, wallet, walletManager)).toBeTrue();

            handler.applyToSender(instance, wallet);
            expect(wallet.secondPublicKey).toBe("02d5cfcbc4920d041d2a54b29e1f69173536796fd50f62af0f88ad6adc6df07cb8");
        });

        it("should be invalid to apply a second signature registration twice", () => {
            expect(handler.canBeApplied(instance, wallet, walletManager)).toBeTrue();

            handler.applyToSender(instance, wallet);
            expect(wallet.secondPublicKey).toBe("02d5cfcbc4920d041d2a54b29e1f69173536796fd50f62af0f88ad6adc6df07cb8");

            expect(() => handler.canBeApplied(instance, wallet, walletManager)).toThrow(
                SecondSignatureAlreadyRegisteredError,
            );
        });
    });

    describe("revert", () => {
        it("should be ok", () => {
            expect(wallet.secondPublicKey).toBeNull();
            expect(handler.canBeApplied(instance, wallet, walletManager)).toBeTrue();

            handler.applyToSender(instance, wallet);
            expect(wallet.secondPublicKey).toBe("02d5cfcbc4920d041d2a54b29e1f69173536796fd50f62af0f88ad6adc6df07cb8");

            handler.revertForSender(instance, wallet);
            expect(wallet.secondPublicKey).toBeNull();
        });
    });
});

describe("DelegateRegistrationTransaction", () => {
    beforeEach(() => {
        wallet = walletFixture;

        transaction = {
            version: 1,
            id: "943c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb4",
            type: 2,
            timestamp: 36482198,
            amount: Utils.BigNumber.ZERO,
            fee: Utils.BigNumber.make(10000000),
            recipientId: "DTRdbaUW3RQQSL5By4G43JVaeHiqfVp9oh",
            senderPublicKey: "034da006f958beba78ec54443df4a3f52237253f7ae8cbdb17dccf3feaa57f3126",
            signature:
                "304402205881204c6e515965098099b0e20a7bf104cd1bad6cfe8efd1641729fcbfdbf1502203cfa3bd9efb2ad250e2709aaf719ac0db04cb85d27a96bc8149aeaab224de82b",
            asset: {
                delegate: {
                    username: "dummy",
                    publicKey: ("a" as any).repeat(66),
                },
            },
        };

        handler = TransactionHandlerRegistry.get(transaction.type);
        instance = Transactions.TransactionFactory.fromData(transaction);
    });

    describe("canApply", () => {
        it("should be true", () => {
            expect(handler.canBeApplied(instance, wallet, walletManager)).toBeTrue();
        });

        it("should be false if wallet already registered a username", () => {
            wallet.username = "dummy";

            expect(() => handler.canBeApplied(instance, wallet, walletManager)).toThrow(WalletUsernameNotEmptyError);
        });

        it("should be false if wallet has insufficient funds", () => {
            wallet.username = "";
            wallet.balance = Utils.BigNumber.ZERO;

            expect(() => handler.canBeApplied(instance, wallet, walletManager)).toThrow(InsufficientBalanceError);
        });
    });

    describe("apply", () => {
        it("should set username", () => {
            handler.applyToSender(instance, wallet);
            expect(wallet.username).toBe("dummy");
        });
    });

    describe("revert", () => {
        it("should unset username", () => {
            handler.revertForSender(instance, wallet);
            expect(wallet.username).toBeNull();
        });
    });
});

describe("VoteTransaction", () => {
    let voteTransaction;
    let unvoteTransaction;
    let delegateWallet;

    beforeEach(() => {
        wallet = {
            address: "DQ7VAW7u171hwDW75R1BqfHbA9yiKRCBSh",
            balance: Utils.BigNumber.make("6453530000000"),
            publicKey: "02a47a2f594635737d2ce9898680812ff7fa6aaa64ddea1360474c110e9985a087",
            vote: null,
        } as Wallet;

        delegateWallet = {
            publicKey: "02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8ae1a1f2af",
            username: "test",
        } as Wallet;

        walletManager.reindex(delegateWallet);

        voteTransaction = {
            id: "73cbce62d69308ff7e69f1a7836106a16dc59907198aea4bb80d340232e53041",
            signature:
                "3045022100f53da6eb18ca7954bb7c620ceeaf5cb3433685d173401146aea35ee8e5f5c95002204ea57f573745c8f5c57b256e38397d3e1977bdbfac295128320401c6117bb2f3",
            timestamp: 54833694,
            type: 3,
            fee: Utils.BigNumber.make(100000000),
            senderPublicKey: "02a47a2f594635737d2ce9898680812ff7fa6aaa64ddea1360474c110e9985a087",
            amount: Utils.BigNumber.ZERO,
            recipientId: "DLvBAvLePTJ9DfDzby5AAkqPqwCVDCT647",
            asset: {
                votes: ["+02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8ae1a1f2af"],
            },
        };

        unvoteTransaction = {
            id: "d714bc0443208f9281ad83f9f3d941628b875c84f65a09601148ce87ca879cb9",
            signature:
                "3045022100957106a924eb40df6ff530cff80fede0195c30284fdb5671e736c7d0b57696f6022072b0fd80af235d79701e9aea74ef48366ef9f5aecedbb5d502e6392569c059c8",
            timestamp: 54833718,
            type: 3,
            fee: Utils.BigNumber.make(100000000),
            senderPublicKey: "02a47a2f594635737d2ce9898680812ff7fa6aaa64ddea1360474c110e9985a087",
            amount: Utils.BigNumber.ZERO,
            recipientId: "DLvBAvLePTJ9DfDzby5AAkqPqwCVDCT647",
            asset: {
                votes: ["-02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8ae1a1f2af"],
            },
        };

        handler = TransactionHandlerRegistry.get(voteTransaction.type);
        instance = Transactions.TransactionFactory.fromData(voteTransaction);
    });

    describe("canApply", () => {
        it("should be true if the vote is valid and the wallet has not voted", () => {
            expect(handler.canBeApplied(instance, wallet, walletManager)).toBeTrue();
        });

        it("should be true if the unvote is valid and the wallet has voted", () => {
            wallet.vote = "02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8ae1a1f2af";
            instance = Transactions.TransactionFactory.fromData(unvoteTransaction);
            expect(handler.canBeApplied(instance, wallet, walletManager)).toBeTrue();
        });

        it("should be false if wallet has already voted", () => {
            wallet.vote = "02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8ae1a1f2af";
            expect(() => handler.canBeApplied(instance, wallet, walletManager)).toThrow(AlreadyVotedError);
        });

        it("should be false if the asset public key differs from the currently voted one", () => {
            wallet.vote = "a310ad026647eed112d1a46145eed58b8c19c67c505a67f1199361a511ce7860c0";
            instance = Transactions.TransactionFactory.fromData(unvoteTransaction);
            expect(() => handler.canBeApplied(instance, wallet, walletManager)).toThrow(UnvoteMismatchError);
        });

        it("should be false if unvoting a non-voted wallet", () => {
            instance = Transactions.TransactionFactory.fromData(unvoteTransaction);
            expect(() => handler.canBeApplied(instance, wallet, walletManager)).toThrow(NoVoteError);
        });

        it("should be false if wallet has insufficient funds", () => {
            wallet.balance = Utils.BigNumber.ZERO;
            expect(() => handler.canBeApplied(instance, wallet, walletManager)).toThrow(InsufficientBalanceError);
        });
    });

    describe("apply", () => {
        describe("vote", () => {
            it("should be ok", () => {
                expect(wallet.vote).toBeNull();

                handler.applyToSender(instance, wallet);
                expect(wallet.vote).not.toBeNull();
            });

            it("should not be ok", () => {
                wallet.vote = "02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8ae1a1f2af";

                expect(wallet.vote).not.toBeNull();

                handler.applyToSender(instance, wallet);

                expect(wallet.vote).not.toBeNull();
            });
        });

        describe("unvote", () => {
            it("should remove the vote from the wallet", () => {
                wallet.vote = "02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8ae1a1f2af";

                expect(wallet.vote).not.toBeNull();

                instance = Transactions.TransactionFactory.fromData(unvoteTransaction);
                handler.applyToSender(instance, wallet);

                expect(wallet.vote).toBeNull();
            });
        });
    });

    describe("revert", () => {
        describe("vote", () => {
            it("should remove the vote from the wallet", () => {
                wallet.vote = "02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8ae1a1f2af";

                expect(wallet.vote).not.toBeNull();

                handler.revertForSender(instance, wallet);

                expect(wallet.vote).toBeNull();
            });
        });

        describe("unvote", () => {
            it("should add the vote to the wallet", () => {
                expect(wallet.vote).toBeNull();

                instance = Transactions.TransactionFactory.fromData(unvoteTransaction);
                handler.revertForSender(instance, wallet);

                expect(wallet.vote).toBe("02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8ae1a1f2af");
            });
        });
    });
});

describe("MultiSignatureRegistrationTransaction", () => {
    let recipientWallet;

    beforeEach(() => {
        transaction = TransactionFactory.multiSignature().create()[0];

        handler = TransactionHandlerRegistry.get(transaction.type);
        instance = Transactions.TransactionFactory.fromData(transaction);

        wallet = new Wallet("ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo");
        wallet.balance = Utils.BigNumber.make(100390000000);
        wallet.publicKey = transaction.senderPublicKey;

        recipientWallet = new Wallet("ARUejF6aYhoY9n6iwmAykPbx47F7wuc86J");
        recipientWallet.balance = Utils.BigNumber.make(0);

        walletManager.reindex(wallet);
        walletManager.reindex(recipientWallet);
    });

    describe("canApply", () => {
        it("should be true", () => {
            expect(handler.canBeApplied(instance, wallet, walletManager)).toBeTrue();
        });

        it("should be false if the wallet already has multisignatures", () => {
            recipientWallet.multisignature = instance.data.asset.multiSignature;
            expect(() => handler.canBeApplied(instance, wallet, walletManager)).toThrow(
                MultiSignatureAlreadyRegisteredError,
            );
        });

        it("should be false if failure to verify signatures", () => {
            wallet.verifySignatures = jest.fn(() => false);
            delete wallet.multisignature;

            expect(() => handler.canBeApplied(instance, wallet, walletManager)).toThrow(InvalidMultiSignatureError);
        });

        it("should be false if failure to verify signatures in asset", () => {
            instance.data.signatures[0] = instance.data.signatures[0].replace("00", "02");
            expect(() => handler.canBeApplied(instance, wallet, walletManager)).toThrow(InvalidMultiSignatureError);
        });

        it("should be false if the number of keys is less than minimum", () => {
            delete wallet.multisignature;

            wallet.verifySignatures = jest.fn(() => true);
            Transactions.Transaction.verifySecondSignature = jest.fn(() => true);

            instance.data.asset.multiSignature.publicKeys.splice(0, 5);
            expect(() => handler.canBeApplied(instance, wallet, walletManager)).toThrow(MultiSignatureMinimumKeysError);
        });

        it("should be false if the number of keys does not equal the signature count", () => {
            delete wallet.multisignature;

            wallet.verifySignatures = jest.fn(() => true);
            Transactions.Transaction.verifySecondSignature = jest.fn(() => true);

            instance.data.signatures.splice(0, 2);
            expect(() => handler.canBeApplied(instance, wallet, walletManager)).toThrow(
                MultiSignatureKeyCountMismatchError,
            );
        });

        it("should be false if wallet has insufficient funds", () => {
            delete wallet.multisignature;
            wallet.balance = Utils.BigNumber.ZERO;

            expect(() => handler.canBeApplied(instance, wallet, walletManager)).toThrow(InsufficientBalanceError);
        });
    });

    describe("apply", () => {
        it("should be ok", () => {
            recipientWallet.multiSignature = null;
            expect(wallet.multisignature).toBeNull();
            expect(recipientWallet.multisignature).toBeNull();

            expect(wallet.balance).toEqual(Utils.BigNumber.make(100390000000));
            expect(recipientWallet.balance).toEqual(Utils.BigNumber.ZERO);

            handler.applyToSender(instance, wallet);

            expect(wallet.balance).toEqual(Utils.BigNumber.make(98390000000));
            expect(recipientWallet.balance).toEqual(Utils.BigNumber.ZERO);

            expect(wallet.multisignature).toBeNull();
            expect(recipientWallet.multisignature).toBeNull();

            handler.applyToRecipient(instance, recipientWallet);

            expect(wallet.multisignature).toBeNull();
            expect(recipientWallet.multisignature).toEqual(transaction.asset.multiSignature);
        });
    });

    describe("revert", () => {
        it("should be ok", () => {
            handler.revertForSender(instance, wallet);

            expect(wallet.multisignature).toBeNull();
        });
    });
});

describe.skip("IpfsTransaction", () => {
    beforeEach(() => {
        transaction = transactionFixture;
        wallet = walletFixture;
        wallet.balance = transaction.amount.plus(transaction.fee);
        handler = TransactionHandlerRegistry.get(transaction.type);
        instance = Transactions.TransactionFactory.fromData(transaction);
    });

    describe("canApply", () => {
        it("should be true", () => {
            expect(handler.canBeApplied(instance, wallet, walletManager)).toBeTrue();
        });

        it("should be false", () => {
            instance.data.senderPublicKey = "a".repeat(66);
            expect(() => handler.canBeApplied(instance, wallet, walletManager)).toThrow(SenderWalletMismatchError);
        });

        it("should be false if wallet has insufficient funds", () => {
            wallet.balance = Utils.BigNumber.ZERO;
            expect(() => handler.canBeApplied(instance, wallet, walletManager)).toThrow(InsufficientBalanceError);
        });
    });
});

describe.skip("TimelockTransferTransaction", () => {
    beforeEach(() => {
        transaction = transactionFixture;
        wallet = walletFixture;
        wallet.balance = transaction.amount.plus(transaction.fee);
        handler = TransactionHandlerRegistry.get(transaction.type);
        instance = Transactions.TransactionFactory.fromData(transaction);
    });

    describe("canApply", () => {
        it("should be true", () => {
            expect(handler.canBeApplied(instance, wallet, walletManager)).toBeTrue();
        });

        it("should be false", () => {
            instance.data.senderPublicKey = "a".repeat(66);
            expect(() => handler.canBeApplied(instance, wallet, walletManager)).toThrow(SenderWalletMismatchError);
        });

        it("should be false if wallet has insufficient funds", () => {
            wallet.balance = Utils.BigNumber.ZERO;
            expect(() => handler.canBeApplied(instance, wallet, walletManager)).toThrow(InsufficientBalanceError);
        });
    });
});

describe.skip("MultiPaymentTransaction", () => {
    beforeEach(() => {
        transaction = {
            version: 1,
            id: "943c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb4",
            type: 7,
            timestamp: 36482198,
            amount: Utils.BigNumber.make(0),
            fee: Utils.BigNumber.make(10000000),
            recipientId: "DTRdbaUW3RQQSL5By4G43JVaeHiqfVp9oh",
            senderPublicKey: "034da006f958beba78ec54443df4a3f52237253f7ae8cbdb17dccf3feaa57f3126",
            signature:
                "304402205881204c6e515965098099b0e20a7bf104cd1bad6cfe8efd1641729fcbfdbf1502203cfa3bd9efb2ad250e2709aaf719ac0db04cb85d27a96bc8149aeaab224de82b",
            asset: {
                payments: [
                    {
                        amount: Utils.BigNumber.make(10),
                        recipientId: "a",
                    },
                    {
                        amount: Utils.BigNumber.make(20),
                        recipientId: "b",
                    },
                    {
                        amount: Utils.BigNumber.make(30),
                        recipientId: "c",
                    },
                    {
                        amount: Utils.BigNumber.make(40),
                        recipientId: "d",
                    },
                    {
                        amount: Utils.BigNumber.make(50),
                        recipientId: "e",
                    },
                ],
            },
        };

        wallet = walletFixture;
        wallet.balance = transaction.amount.plus(transaction.fee);
        handler = TransactionHandlerRegistry.get(transaction.type);
        instance = Transactions.TransactionFactory.fromData(transaction);
    });

    describe("canApply", () => {
        it("should be true", () => {
            expect(handler.canBeApplied(instance, wallet, walletManager)).toBeTrue();
        });

        it("should be false if wallet has insufficient funds", () => {
            wallet.balance = Utils.BigNumber.ZERO;
            expect(() => handler.canBeApplied(instance, wallet, walletManager)).toThrow(InsufficientBalanceError);
        });

        it("should be false if wallet has insufficient funds send all payouts", () => {
            wallet.balance = Utils.BigNumber.ZERO;
            expect(() => handler.canBeApplied(instance, wallet, walletManager)).toThrow(InsufficientBalanceError);
        });
    });
});

describe.skip("DelegateResignationTransaction", () => {
    beforeEach(() => {
        transaction = transactionFixture;
        wallet = walletFixture;
        wallet.balance = transaction.amount.plus(transaction.fee);
        handler = TransactionHandlerRegistry.get(transaction.type);
        instance = Transactions.TransactionFactory.fromData(transaction);
    });

    describe("canApply", () => {
        it("should be truth", () => {
            wallet.username = "dummy";
            expect(handler.canBeApplied(instance, wallet, walletManager)).toBeTrue();
        });

        it.skip("should be false if wallet has no registered username", () => {
            wallet.username = null;
            expect(() => handler.canBeApplied(instance, wallet, walletManager)).toThrow(WalletNoUsernameError);
        });

        it("should be false if wallet has insufficient funds", () => {
            wallet.balance = Utils.BigNumber.ZERO;
            expect(() => handler.canBeApplied(instance, wallet, walletManager)).toThrow(InsufficientBalanceError);
        });
    });
});
