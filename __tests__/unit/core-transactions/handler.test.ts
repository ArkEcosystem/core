import "jest-extended";

import { Database } from "@arkecosystem/core-interfaces";
import { Wallets } from "@arkecosystem/core-state";
import { Identities, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
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
import { Handlers } from "../../../packages/core-transactions/src/index";
import { TransactionFactory } from "../../helpers";
import { transaction as transactionFixture } from "../crypto/transactions/__fixtures__/transaction";
import { wallet as walletFixture } from "../crypto/transactions/__fixtures__/wallet";

let senderWallet: Wallets.Wallet;
let recipientWallet: Wallets.Wallet;
let transaction: Interfaces.ITransactionData;
let transactionWithSecondSignature: Interfaces.ITransactionData;
let handler: TransactionHandler;
let instance: Interfaces.ITransaction;
let walletManager: Database.IWalletManager;

beforeEach(() => {
    walletManager = new Wallets.WalletManager();

    senderWallet = new Wallets.Wallet("D5q7YfEFDky1JJVQQEy4MGyiUhr5cGg47F");
    senderWallet.balance = Utils.BigNumber.make(4527654310);
    senderWallet.publicKey = "02a47a2f594635737d2ce9898680812ff7fa6aaa64ddea1360474c110e9985a087";

    recipientWallet = new Wallets.Wallet("D7g4i3TuD8GEbeU2tt3a5fKZny3vyvD64r");
    recipientWallet.publicKey = "03d04acca0ad922998d258438cc453ce50222b0e761ae9a499ead6a11f3a44b70b";

    walletManager.reindex(senderWallet);
    walletManager.reindex(recipientWallet);

    transaction = {
        id: "65a4f09a3a19d212a65d27de05d1ae7e0c461e088a35499996667f98d2a3897c",
        signature:
            "304402206974568da7c363155decbc20ddc17746a2e7e663901c426f5a41411374cc6d18022052f4353ec93227713f9907f2bb2549e6bc42584b736aa5f9ff36e2c239154648",
        timestamp: 54836734,
        type: 0,
        fee: Utils.BigNumber.make(10000000),
        senderPublicKey: "02a47a2f594635737d2ce9898680812ff7fa6aaa64ddea1360474c110e9985a087",
        amount: Utils.BigNumber.make(10000000),
        recipientId: "D7g4i3TuD8GEbeU2tt3a5fKZny3vyvD64r",
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
        recipientId: "D7g4i3TuD8GEbeU2tt3a5fKZny3vyvD64r",
    };
});

describe("General Tests", () => {
    beforeEach(() => {
        handler = Handlers.Registry.get(transaction.type);
        instance = Transactions.TransactionFactory.fromData(transaction);
    });

    describe("canBeApplied", () => {
        it("should be true", () => {
            expect(handler.canBeApplied(instance, senderWallet, walletManager)).toBeTrue();
        });

        it("should be true if the transaction has a second signature but wallet does not, when ignoreInvalidSecondSignatureField=true", () => {
            Managers.configManager.getMilestone().ignoreInvalidSecondSignatureField = true;
            instance = Transactions.TransactionFactory.fromData(transactionWithSecondSignature);
            expect(handler.canBeApplied(instance, senderWallet, walletManager)).toBeTrue();
        });

        it("should be false if wallet publicKey does not match tx senderPublicKey", () => {
            instance.data.senderPublicKey = "a".repeat(66);
            expect(() => handler.canBeApplied(instance, senderWallet, walletManager)).toThrow(
                SenderWalletMismatchError,
            );
        });

        it("should be false if the transaction has a second signature but wallet does not", () => {
            delete Managers.configManager.getMilestone().ignoreInvalidSecondSignatureField;
            instance = Transactions.TransactionFactory.fromData(transactionWithSecondSignature);
            expect(() => handler.canBeApplied(instance, senderWallet, walletManager)).toThrow(
                UnexpectedSecondSignatureError,
            );
        });

        it("should be false if the wallet has a second public key but the transaction second signature does not match", () => {
            senderWallet.secondPublicKey = "invalid-public-key";
            expect(() => handler.canBeApplied(instance, senderWallet, walletManager)).toThrow(
                InvalidSecondSignatureError,
            );
        });

        it("should be false if wallet has not enough balance", () => {
            // 1 arktoshi short
            senderWallet.balance = transaction.amount.plus(transaction.fee).minus(1);
            expect(() => handler.canBeApplied(instance, senderWallet, walletManager)).toThrow(InsufficientBalanceError);
        });

        it("should be true even with publicKey case mismatch", () => {
            transaction.senderPublicKey = transaction.senderPublicKey.toUpperCase();
            senderWallet.publicKey = senderWallet.publicKey.toLowerCase();
            instance = Transactions.TransactionFactory.fromData(transaction);
            expect(handler.canBeApplied(instance, senderWallet, walletManager)).toBeTrue();
        });
    });

    describe("apply", () => {
        it("should be ok", () => {
            const senderBalance = senderWallet.balance;
            const recipientBalance = recipientWallet.balance;

            handler.apply(instance, walletManager);

            expect(senderWallet.balance).toEqual(
                Utils.BigNumber.make(senderBalance)
                    .minus(instance.data.amount)
                    .minus(instance.data.fee),
            );

            expect(recipientWallet.balance).toEqual(Utils.BigNumber.make(recipientBalance).plus(instance.data.amount));
        });

        it("should not fail due to case mismatch", () => {
            transaction.senderPublicKey = transaction.senderPublicKey.toUpperCase();
            const instance = Transactions.TransactionFactory.fromData(transaction);

            const senderBalance = senderWallet.balance;
            const recipientBalance = recipientWallet.balance;

            handler.apply(instance, walletManager);

            expect(senderWallet.balance).toEqual(
                Utils.BigNumber.make(senderBalance)
                    .minus(instance.data.amount)
                    .minus(instance.data.fee),
            );

            expect(recipientWallet.balance).toEqual(Utils.BigNumber.make(recipientBalance).plus(instance.data.amount));
        });
    });

    describe("revert", () => {
        it("should be ok", () => {
            const senderBalance = senderWallet.balance;
            const recipientBalance = recipientWallet.balance;

            handler.revert(instance, walletManager);
            expect(senderWallet.balance).toEqual(
                Utils.BigNumber.make(senderBalance)
                    .plus(instance.data.amount)
                    .plus(instance.data.fee),
            );

            expect(recipientWallet.balance).toEqual(Utils.BigNumber.make(recipientBalance).minus(instance.data.amount));
        });

        it("should not fail due to case mismatch", () => {
            transaction.senderPublicKey = transaction.senderPublicKey.toUpperCase();
            const instance = Transactions.TransactionFactory.fromData(transaction);

            const senderBalance = senderWallet.balance;
            const recipientBalance = recipientWallet.balance;

            handler.revert(instance, walletManager);
            expect(senderWallet.balance).toEqual(
                Utils.BigNumber.make(senderBalance)
                    .plus(instance.data.amount)
                    .plus(instance.data.fee),
            );

            expect(recipientWallet.balance).toEqual(Utils.BigNumber.make(recipientBalance).minus(instance.data.amount));
        });
    });
});

describe("TransferTransaction", () => {
    beforeEach(() => {
        senderWallet = walletFixture;
        transaction = transactionFixture;
        handler = Handlers.Registry.get(transaction.type);
        instance = Transactions.TransactionFactory.fromData(transaction);
    });

    describe("canBeApplied", () => {
        it("should be true", () => {
            expect(handler.canBeApplied(instance, senderWallet, walletManager)).toBeTrue();
        });

        it("should be false", () => {
            instance.data.senderPublicKey = "a".repeat(66);
            expect(() => handler.canBeApplied(instance, senderWallet, walletManager)).toThrow(
                SenderWalletMismatchError,
            );
        });
    });
});

describe("SecondSignatureRegistrationTransaction", () => {
    beforeEach(() => {
        senderWallet = new Wallets.Wallet("DSD9Wi2rfqzDb3REUB5MELQGrsUAjY67gj");
        senderWallet.balance = Utils.BigNumber.make("6453530000000");
        senderWallet.publicKey = "03cba4fd60f856ad034ee0a9146432757ae35956b640c26fb6674061924b05a5c9";
        senderWallet.secondPublicKey = null;

        walletManager.reindex(senderWallet);

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

        handler = Handlers.Registry.get(transaction.type);
        instance = Transactions.TransactionFactory.fromData(transaction);
    });

    describe("canBeApplied", () => {
        it("should be true", () => {
            expect(handler.canBeApplied(instance, senderWallet, walletManager)).toBeTrue();
        });

        it("should be false if wallet already has a second signature", () => {
            senderWallet.secondPublicKey = "02d5cfcbc4920d041d2a54b29e1f69173536796fd50f62af0f88ad6adc6df07cb8";

            expect(() => handler.canBeApplied(instance, senderWallet, walletManager)).toThrow(
                SecondSignatureAlreadyRegisteredError,
            );
        });

        it("should be false if wallet has insufficient funds", () => {
            senderWallet.balance = Utils.BigNumber.ZERO;

            expect(() => handler.canBeApplied(instance, senderWallet, walletManager)).toThrow(InsufficientBalanceError);
        });
    });

    describe("apply", () => {
        it("should apply second signature registration", () => {
            expect(handler.canBeApplied(instance, senderWallet, walletManager)).toBeTrue();

            handler.apply(instance, walletManager);
            expect(senderWallet.secondPublicKey).toBe(
                "02d5cfcbc4920d041d2a54b29e1f69173536796fd50f62af0f88ad6adc6df07cb8",
            );
        });

        it("should be invalid to apply a second signature registration twice", () => {
            expect(handler.canBeApplied(instance, senderWallet, walletManager)).toBeTrue();

            handler.apply(instance, walletManager);
            expect(senderWallet.secondPublicKey).toBe(
                "02d5cfcbc4920d041d2a54b29e1f69173536796fd50f62af0f88ad6adc6df07cb8",
            );

            expect(() => handler.canBeApplied(instance, senderWallet, walletManager)).toThrow(
                SecondSignatureAlreadyRegisteredError,
            );
        });
    });

    describe("revert", () => {
        it("should be ok", () => {
            expect(senderWallet.secondPublicKey).toBeNull();
            expect(handler.canBeApplied(instance, senderWallet, walletManager)).toBeTrue();

            handler.apply(instance, walletManager);
            expect(senderWallet.secondPublicKey).toBe(
                "02d5cfcbc4920d041d2a54b29e1f69173536796fd50f62af0f88ad6adc6df07cb8",
            );

            handler.revert(instance, walletManager);
            expect(senderWallet.secondPublicKey).toBeNull();
        });
    });
});

describe("DelegateRegistrationTransaction", () => {
    beforeEach(() => {
        senderWallet = walletFixture;

        walletManager.reindex(senderWallet);

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

        handler = Handlers.Registry.get(transaction.type);
        instance = Transactions.TransactionFactory.fromData(transaction);
    });

    describe("canApply", () => {
        it("should be true", () => {
            expect(handler.canBeApplied(instance, senderWallet, walletManager)).toBeTrue();
        });

        it("should be false if wallet already registered a username", () => {
            senderWallet.username = "dummy";

            expect(() => handler.canBeApplied(instance, senderWallet, walletManager)).toThrow(
                WalletUsernameNotEmptyError,
            );
        });

        it("should be false if wallet has insufficient funds", () => {
            walletManager.forgetByUsername("dummy");
            senderWallet.username = "";
            senderWallet.balance = Utils.BigNumber.ZERO;

            expect(() => handler.canBeApplied(instance, senderWallet, walletManager)).toThrow(InsufficientBalanceError);
        });
    });

    describe("apply", () => {
        it("should set username", () => {
            handler.apply(instance, walletManager);
            expect(senderWallet.username).toBe("dummy");
        });
    });

    describe("revert", () => {
        it("should unset username", () => {
            handler.revert(instance, walletManager);
            expect(senderWallet.username).toBeNull();
        });
    });
});

describe("VoteTransaction", () => {
    let voteTransaction;
    let unvoteTransaction;
    let delegateWallet;

    beforeEach(() => {
        senderWallet = new Wallets.Wallet("DQ7VAW7u171hwDW75R1BqfHbA9yiKRCBSh");
        senderWallet.balance = Utils.BigNumber.make("6453530000000");
        senderWallet.publicKey = "02a47a2f594635737d2ce9898680812ff7fa6aaa64ddea1360474c110e9985a087";
        senderWallet.vote = null;

        const delegatePublicKey = "02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8ae1a1f2af";
        delegateWallet = new Wallets.Wallet(Identities.Address.fromPublicKey(delegatePublicKey));
        delegateWallet.publicKey = delegatePublicKey;
        delegateWallet.username = "test";

        walletManager.reindex(senderWallet);
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

        handler = Handlers.Registry.get(voteTransaction.type);
        instance = Transactions.TransactionFactory.fromData(voteTransaction);
    });

    describe("canApply", () => {
        it("should be true if the vote is valid and the wallet has not voted", () => {
            expect(handler.canBeApplied(instance, senderWallet, walletManager)).toBeTrue();
        });

        it("should be true if the unvote is valid and the wallet has voted", () => {
            senderWallet.vote = "02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8ae1a1f2af";
            instance = Transactions.TransactionFactory.fromData(unvoteTransaction);
            expect(handler.canBeApplied(instance, senderWallet, walletManager)).toBeTrue();
        });

        it("should be false if wallet has already voted", () => {
            senderWallet.vote = "02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8ae1a1f2af";
            expect(() => handler.canBeApplied(instance, senderWallet, walletManager)).toThrow(AlreadyVotedError);
        });

        it("should be false if the asset public key differs from the currently voted one", () => {
            senderWallet.vote = "a310ad026647eed112d1a46145eed58b8c19c67c505a67f1199361a511ce7860c0";
            instance = Transactions.TransactionFactory.fromData(unvoteTransaction);
            expect(() => handler.canBeApplied(instance, senderWallet, walletManager)).toThrow(UnvoteMismatchError);
        });

        it("should be false if unvoting a non-voted wallet", () => {
            instance = Transactions.TransactionFactory.fromData(unvoteTransaction);
            expect(() => handler.canBeApplied(instance, senderWallet, walletManager)).toThrow(NoVoteError);
        });

        it("should be false if wallet has insufficient funds", () => {
            senderWallet.balance = Utils.BigNumber.ZERO;
            expect(() => handler.canBeApplied(instance, senderWallet, walletManager)).toThrow(InsufficientBalanceError);
        });
    });

    describe("apply", () => {
        describe("vote", () => {
            it("should be ok", () => {
                expect(senderWallet.vote).toBeNull();

                handler.apply(instance, walletManager);
                expect(senderWallet.vote).not.toBeNull();
            });

            it("should not be ok", () => {
                senderWallet.vote = "02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8ae1a1f2af";

                expect(senderWallet.vote).not.toBeNull();

                handler.apply(instance, walletManager);

                expect(senderWallet.vote).not.toBeNull();
            });
        });

        describe("unvote", () => {
            it("should remove the vote from the wallet", () => {
                senderWallet.vote = "02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8ae1a1f2af";

                expect(senderWallet.vote).not.toBeNull();

                instance = Transactions.TransactionFactory.fromData(unvoteTransaction);
                handler.apply(instance, walletManager);

                expect(senderWallet.vote).toBeNull();
            });
        });
    });

    describe("revert", () => {
        describe("vote", () => {
            it("should remove the vote from the wallet", () => {
                senderWallet.vote = "02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8ae1a1f2af";

                expect(senderWallet.vote).not.toBeNull();

                handler.revert(instance, walletManager);

                expect(senderWallet.vote).toBeNull();
            });
        });

        describe("unvote", () => {
            it("should add the vote to the wallet", () => {
                expect(senderWallet.vote).toBeNull();

                instance = Transactions.TransactionFactory.fromData(unvoteTransaction);
                handler.revert(instance, walletManager);

                expect(senderWallet.vote).toBe("02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8ae1a1f2af");
            });
        });
    });
});

describe("MultiSignatureRegistrationTransaction", () => {
    beforeEach(() => {
        transaction = TransactionFactory.multiSignature().create()[0];

        handler = Handlers.Registry.get(transaction.type);
        instance = Transactions.TransactionFactory.fromData(transaction);

        senderWallet = new Wallets.Wallet("ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo");
        senderWallet.balance = Utils.BigNumber.make(100390000000);
        senderWallet.publicKey = transaction.senderPublicKey;

        const multiSignatureAddress = Identities.Address.fromMultiSignatureAsset(instance.data.asset.multiSignature);
        recipientWallet = new Wallets.Wallet(multiSignatureAddress);
        recipientWallet.balance = Utils.BigNumber.make(0);

        walletManager.reindex(senderWallet);
        walletManager.reindex(recipientWallet);
    });

    describe("canApply", () => {
        it("should be true", () => {
            expect(handler.canBeApplied(instance, senderWallet, walletManager)).toBeTrue();
        });

        it("should be false if the wallet already has multisignatures", () => {
            recipientWallet.multisignature = instance.data.asset.multiSignature;
            expect(() => handler.canBeApplied(instance, senderWallet, walletManager)).toThrow(
                MultiSignatureAlreadyRegisteredError,
            );
        });

        it("should be false if failure to verify signatures", () => {
            senderWallet.verifySignatures = jest.fn(() => false);
            delete senderWallet.multisignature;

            expect(() => handler.canBeApplied(instance, senderWallet, walletManager)).toThrow(
                InvalidMultiSignatureError,
            );
        });

        it("should be false if failure to verify signatures in asset", () => {
            instance.data.signatures[0] = instance.data.signatures[0].replace("00", "02");
            expect(() => handler.canBeApplied(instance, senderWallet, walletManager)).toThrow(
                InvalidMultiSignatureError,
            );
        });

        it("should be false if the number of keys is less than minimum", () => {
            delete senderWallet.multisignature;

            senderWallet.verifySignatures = jest.fn(() => true);
            Transactions.Verifier.verifySecondSignature = jest.fn(() => true);

            instance.data.asset.multiSignature.publicKeys.splice(0, 5);
            expect(() => handler.canBeApplied(instance, senderWallet, walletManager)).toThrow(
                MultiSignatureMinimumKeysError,
            );
        });

        it("should be false if the number of keys does not equal the signature count", () => {
            delete senderWallet.multisignature;

            senderWallet.verifySignatures = jest.fn(() => true);
            Transactions.Verifier.verifySecondSignature = jest.fn(() => true);

            instance.data.signatures.splice(0, 2);
            expect(() => handler.canBeApplied(instance, senderWallet, walletManager)).toThrow(
                MultiSignatureKeyCountMismatchError,
            );
        });

        it("should be false if wallet has insufficient funds", () => {
            delete senderWallet.multisignature;
            senderWallet.balance = Utils.BigNumber.ZERO;

            expect(() => handler.canBeApplied(instance, senderWallet, walletManager)).toThrow(InsufficientBalanceError);
        });
    });

    describe("apply", () => {
        it("should be ok", () => {
            recipientWallet.multisignature = null;

            expect(senderWallet.multisignature).toBeNull();
            expect(recipientWallet.multisignature).toBeNull();

            expect(senderWallet.balance).toEqual(Utils.BigNumber.make(100390000000));
            expect(recipientWallet.balance).toEqual(Utils.BigNumber.ZERO);

            handler.apply(instance, walletManager);

            expect(senderWallet.balance).toEqual(Utils.BigNumber.make(98390000000));
            expect(recipientWallet.balance).toEqual(Utils.BigNumber.ZERO);

            expect(senderWallet.multisignature).toBeNull();
            expect(recipientWallet.multisignature).toEqual(transaction.asset.multiSignature);
        });
    });

    describe("revert", () => {
        it("should be ok", () => {
            handler.revert(instance, walletManager);

            expect(senderWallet.multisignature).toBeNull();
            expect(recipientWallet.multisignature).toBeNull();
        });
    });
});

describe.skip("IpfsTransaction", () => {
    beforeEach(() => {
        transaction = transactionFixture;
        senderWallet = walletFixture;
        senderWallet.balance = transaction.amount.plus(transaction.fee);
        handler = Handlers.Registry.get(transaction.type);
        instance = Transactions.TransactionFactory.fromData(transaction);
    });

    describe("canApply", () => {
        it("should be true", () => {
            expect(handler.canBeApplied(instance, senderWallet, walletManager)).toBeTrue();
        });

        it("should be false", () => {
            instance.data.senderPublicKey = "a".repeat(66);
            expect(() => handler.canBeApplied(instance, senderWallet, walletManager)).toThrow(
                SenderWalletMismatchError,
            );
        });

        it("should be false if wallet has insufficient funds", () => {
            senderWallet.balance = Utils.BigNumber.ZERO;
            expect(() => handler.canBeApplied(instance, senderWallet, walletManager)).toThrow(InsufficientBalanceError);
        });
    });
});

describe.skip("TimelockTransferTransaction", () => {
    beforeEach(() => {
        transaction = transactionFixture;
        senderWallet = walletFixture;
        senderWallet.balance = transaction.amount.plus(transaction.fee);
        handler = Handlers.Registry.get(transaction.type);
        instance = Transactions.TransactionFactory.fromData(transaction);
    });

    describe("canApply", () => {
        it("should be true", () => {
            expect(handler.canBeApplied(instance, senderWallet, walletManager)).toBeTrue();
        });

        it("should be false", () => {
            instance.data.senderPublicKey = "a".repeat(66);
            expect(() => handler.canBeApplied(instance, senderWallet, walletManager)).toThrow(
                SenderWalletMismatchError,
            );
        });

        it("should be false if wallet has insufficient funds", () => {
            senderWallet.balance = Utils.BigNumber.ZERO;
            expect(() => handler.canBeApplied(instance, senderWallet, walletManager)).toThrow(InsufficientBalanceError);
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

        senderWallet = walletFixture;
        senderWallet.balance = transaction.amount.plus(transaction.fee);
        handler = Handlers.Registry.get(transaction.type);
        instance = Transactions.TransactionFactory.fromData(transaction);
    });

    describe("canApply", () => {
        it("should be true", () => {
            expect(handler.canBeApplied(instance, senderWallet, walletManager)).toBeTrue();
        });

        it("should be false if wallet has insufficient funds", () => {
            senderWallet.balance = Utils.BigNumber.ZERO;
            expect(() => handler.canBeApplied(instance, senderWallet, walletManager)).toThrow(InsufficientBalanceError);
        });

        it("should be false if wallet has insufficient funds send all payouts", () => {
            senderWallet.balance = Utils.BigNumber.ZERO;
            expect(() => handler.canBeApplied(instance, senderWallet, walletManager)).toThrow(InsufficientBalanceError);
        });
    });
});

describe.skip("DelegateResignationTransaction", () => {
    beforeEach(() => {
        transaction = transactionFixture;
        senderWallet = walletFixture;
        senderWallet.balance = transaction.amount.plus(transaction.fee);
        handler = Handlers.Registry.get(transaction.type);
        instance = Transactions.TransactionFactory.fromData(transaction);
    });

    describe("canApply", () => {
        it("should be truth", () => {
            senderWallet.username = "dummy";
            expect(handler.canBeApplied(instance, senderWallet, walletManager)).toBeTrue();
        });

        it.skip("should be false if wallet has no registered username", () => {
            senderWallet.username = null;
            expect(() => handler.canBeApplied(instance, senderWallet, walletManager)).toThrow(WalletNoUsernameError);
        });

        it("should be false if wallet has insufficient funds", () => {
            senderWallet.balance = Utils.BigNumber.ZERO;
            expect(() => handler.canBeApplied(instance, senderWallet, walletManager)).toThrow(InsufficientBalanceError);
        });
    });
});
