import "jest-extended";

import { Wallet } from "@arkecosystem/core-database";
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
import { transaction as transactionFixture } from "../crypto/transactions/__fixtures__/transaction";
import { wallet as walletFixture } from "../crypto/transactions/__fixtures__/wallet";

let wallet: Wallet;
let transaction: Interfaces.ITransactionData;
let transactionWithSecondSignature: Interfaces.ITransactionData;
let handler: TransactionHandler;
let instance: any;

beforeEach(() => {
    wallet = {
        address: "D5q7YfEFDky1JJVQQEy4MGyiUhr5cGg47F",
        balance: Utils.BigNumber.make(4527654310),
        publicKey: "02a47a2f594635737d2ce9898680812ff7fa6aaa64ddea1360474c110e9985a087",
    } as Wallet;

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
            expect(handler.canBeApplied(instance, wallet)).toBeTrue();
        });

        it("should be true if the transaction has a second signature but wallet does not, when ignoreInvalidSecondSignatureField=true", () => {
            Managers.configManager.getMilestone().ignoreInvalidSecondSignatureField = true;
            instance = Transactions.TransactionFactory.fromData(transactionWithSecondSignature);
            expect(handler.canBeApplied(instance, wallet)).toBeTrue();
        });

        it("should be false if wallet publicKey does not match tx senderPublicKey", () => {
            instance.data.senderPublicKey = "a".repeat(66);
            expect(() => handler.canBeApplied(instance, wallet)).toThrow(SenderWalletMismatchError);
        });

        it("should be false if the transaction has a second signature but wallet does not", () => {
            delete Managers.configManager.getMilestone().ignoreInvalidSecondSignatureField;
            instance = Transactions.TransactionFactory.fromData(transactionWithSecondSignature);
            expect(() => handler.canBeApplied(instance, wallet)).toThrow(UnexpectedSecondSignatureError);
        });

        it("should be false if the wallet has a second public key but the transaction second signature does not match", () => {
            wallet.secondPublicKey = "invalid-public-key";
            expect(() => handler.canBeApplied(instance, wallet)).toThrow(InvalidSecondSignatureError);
        });

        it("should be false if wallet has not enough balance", () => {
            // 1 arktoshi short
            wallet.balance = transaction.amount.plus(transaction.fee).minus(1);
            expect(() => handler.canBeApplied(instance, wallet)).toThrow(InsufficientBalanceError);
        });

        it("should be true even with publicKey case mismatch", () => {
            transaction.senderPublicKey = transaction.senderPublicKey.toUpperCase();
            wallet.publicKey = wallet.publicKey.toLowerCase();
            instance = Transactions.TransactionFactory.fromData(transaction);
            expect(handler.canBeApplied(instance, wallet)).toBeTrue();
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
            expect(handler.canBeApplied(instance, wallet)).toBeTrue();
        });

        it("should be false", () => {
            instance.data.senderPublicKey = "a".repeat(66);
            expect(() => handler.canBeApplied(instance, wallet)).toThrow(SenderWalletMismatchError);
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
            expect(handler.canBeApplied(instance, wallet)).toBeTrue();
        });

        it("should be false if wallet already has a second signature", () => {
            wallet.secondPublicKey = "02d5cfcbc4920d041d2a54b29e1f69173536796fd50f62af0f88ad6adc6df07cb8";

            expect(() => handler.canBeApplied(instance, wallet)).toThrow(SecondSignatureAlreadyRegisteredError);
        });

        it("should be false if wallet has insufficient funds", () => {
            wallet.balance = Utils.BigNumber.ZERO;

            expect(() => handler.canBeApplied(instance, wallet)).toThrow(InsufficientBalanceError);
        });
    });

    describe("apply", () => {
        it("should apply second signature registration", () => {
            expect(handler.canBeApplied(instance, wallet)).toBeTrue();

            handler.applyToSender(instance, wallet);
            expect(wallet.secondPublicKey).toBe("02d5cfcbc4920d041d2a54b29e1f69173536796fd50f62af0f88ad6adc6df07cb8");
        });

        it("should be invalid to apply a second signature registration twice", () => {
            expect(handler.canBeApplied(instance, wallet)).toBeTrue();

            handler.applyToSender(instance, wallet);
            expect(wallet.secondPublicKey).toBe("02d5cfcbc4920d041d2a54b29e1f69173536796fd50f62af0f88ad6adc6df07cb8");

            expect(() => handler.canBeApplied(instance, wallet)).toThrow(SecondSignatureAlreadyRegisteredError);
        });
    });

    describe("revert", () => {
        it("should be ok", () => {
            expect(wallet.secondPublicKey).toBeNull();
            expect(handler.canBeApplied(instance, wallet)).toBeTrue();

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
            expect(handler.canBeApplied(instance, wallet)).toBeTrue();
        });

        it("should be false if wallet already registered a username", () => {
            wallet.username = "dummy";

            expect(() => handler.canBeApplied(instance, wallet)).toThrow(WalletUsernameNotEmptyError);
        });

        it("should be false if wallet has insufficient funds", () => {
            wallet.username = "";
            wallet.balance = Utils.BigNumber.ZERO;

            expect(() => handler.canBeApplied(instance, wallet)).toThrow(InsufficientBalanceError);
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

    beforeEach(() => {
        wallet = {
            address: "DQ7VAW7u171hwDW75R1BqfHbA9yiKRCBSh",
            balance: Utils.BigNumber.make("6453530000000"),
            publicKey: "02a47a2f594635737d2ce9898680812ff7fa6aaa64ddea1360474c110e9985a087",
            vote: null,
        } as Wallet;

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
            expect(handler.canBeApplied(instance, wallet)).toBeTrue();
        });

        it("should be true if the unvote is valid and the wallet has voted", () => {
            wallet.vote = "02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8ae1a1f2af";
            instance = Transactions.TransactionFactory.fromData(unvoteTransaction);
            expect(handler.canBeApplied(instance, wallet)).toBeTrue();
        });

        it("should be false if wallet has already voted", () => {
            wallet.vote = "02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8ae1a1f2af";
            expect(() => handler.canBeApplied(instance, wallet)).toThrow(AlreadyVotedError);
        });

        it("should be false if the asset public key differs from the currently voted one", () => {
            wallet.vote = "a310ad026647eed112d1a46145eed58b8c19c67c505a67f1199361a511ce7860c0";
            instance = Transactions.TransactionFactory.fromData(unvoteTransaction);
            expect(() => handler.canBeApplied(instance, wallet)).toThrow(UnvoteMismatchError);
        });

        it("should be false if unvoting a non-voted wallet", () => {
            instance = Transactions.TransactionFactory.fromData(unvoteTransaction);
            expect(() => handler.canBeApplied(instance, wallet)).toThrow(NoVoteError);
        });

        it("should be false if wallet has insufficient funds", () => {
            wallet.balance = Utils.BigNumber.ZERO;
            expect(() => handler.canBeApplied(instance, wallet)).toThrow(InsufficientBalanceError);
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

describe.skip("MultiSignatureRegistrationTransaction", () => {
    let multisignatureTest;

    beforeEach(() => {
        wallet = new Wallet("D61xc3yoBQDitwjqUspMPx1ooET6r1XLt7");
        wallet.balance = Utils.BigNumber.make(100390000000);
        wallet.publicKey = "026f717e50bf3dbb9d8593996df5435ba22217410fc7a132f3d2c942a01a00a202";
        wallet.secondPublicKey = "0380728436880a0a11eadf608c4d4e7f793719e044ee5151074a5f2d5d43cb9066";
        wallet.multisignature = multisignatureTest;

        transaction = {
            version: 1,
            id: "e22ddd7385b42c00f79b9c6ecd253333ddef6e0bf955341ace2e63dad1f4bd70",
            type: 4,
            timestamp: 48059808,
            amount: Utils.BigNumber.ZERO,
            fee: Utils.BigNumber.make(8000000000),
            recipientId: "DGN48KSVFx88chiSu7JbqkAXstqtM1uLJQ",
            senderPublicKey: "026f717e50bf3dbb9d8593996df5435ba22217410fc7a132f3d2c942a01a00a202",
            signature:
                "30450221008baddfae37be66d725e22d9e93c10334d859558f2aef38762803178dbb39354f022025a9bdc7fc4c86d3f67cd1d012dbee3d5691ab3188b5457fdeae82fdd5995767",
            secondSignature:
                "3045022100eb9844a235309309f805235ec40336260cc3dc2c3cbb4cb687dd55b32d8f405402202a98ca5b3b2ad31cec0ed01d9c085a828dd5c07c3893858d4c127fce57d6d410",
            signatures: [
                "3045022100f073a3f59ed753f98734462dbe7c9082bb7cb9d46348c671708c93df2fdd2a7602206dc19039d3561f8d1226755dd3b0ca25f359347729eff066eaf3cc3b5c18bc59",
                "3045022100c560d6d8504b6761245f7bb3e3b723380b50c380ae30c9544c781f3a9b1359a702206b50506ba6c0a39bed7bec226b55bf9ece979716eb95e2a757f025d3592fde17",
                "30440220344345bcb9754ab242dc27bd3d705e5213597914183818005ff1f2e91466f17a0220474c27d05cd5f121c3cad0295e6fc9f8a8cdfa03647e70eb3783e4c1139dde04",
                "3045022100998e29255a8f1c140aa41d93ec43271fd8d0e5b9c18df366e3c7b59cc0c293d902205292dd36e9db18f072f00559267361b9426ab26bff2ee613ec0c3627317b4dab",
                "3044022007379b5643032d9e9d3395298776be041b2a85a211be2d7b6a5855cf030ae0ca02203c5d3da458034483fdef9f43ee4db4428999cfeb8893795f695e663407238090",
                "3044022060461195aeb4386dfab1e3618cdec48f4b988ea394461962379cdbfe8f17b7110220415522adf0239bff7e44e6c0cc8d57211d9d9fe745a6ba2911a81586d5dfc5dc",
                "3044022057355ab8ad9502745895a649aede98dfe829c46465eda57438720baeaa6ece5c02200ed3c2eb019579b243380ac066d691f6f27012dc6b93a1403e1a49c992cc0812",
                "3044022010cf1079e46cbac198e49f763795095c3a1f33b772cf3e6f335c313f786eb0570220450a110a813cc5453265f0e97850794b0f9d5c6efd6d9ea08009df3d4b9f2299",
                "3044022000f35223b23f03413f17538b157e62388c0b150fc046fdcc35792a48d694499402205c2e494ca74565e7841cd6034228cd3d9b57bb832f0da5834991bf92b415c0b8",
                "304402206b69cbd52335fca4a510fa1dcb1417617ad1128aa06dcf543d1f11890e46fdef022012d3054adc0a924429d34091910bf82c0abc757f39cfc0887c7e4d9b35f21ad6",
                "30440220490bf3e963aa500404e5d559dc06bb1ce176ddbab92f46add87c17c19c3781c90220775f0a3f65d95e3e268eb1f2f2fc86044995e7ebdd1f51f99a973fd00c952d57",
                "30450221008795d2e1a454c2cbda92d5fcb7e539372cefbe9f8a181d658abcbd2ba18da8e702207b395488d31f037dc158c12799885edb94f36b1437b2bda79d9074c9a82aa686",
                "3045022100cf706e93a9984a958dba6e17287d17febae005d277afc77890e0a3912ee7ed3d02206618718ee68cae209c42a801b7b295fa2564878838712a1b22beaa3637b57c58",
                "30440220743aba2fdb663dda73b64ada17812a98adf26f2419c6ab2cfba8f66666527a91022036ade1b37b72079eb43b51a8fe5e31da2e42f7b6d0b437f8a693cc276b9123b8",
                "304402206902fc8f519670a7768ad13f1b2d69373aa14c89b70020f83273d6bb0cfd89d102207de30b9ac0c17ff11e364b72c41f1cd8d4e6dccbe28399cb78e96eea32deef12",
            ],
            asset: {
                multisignature: {
                    min: 15,
                    lifetime: 72,
                    keysgroup: [
                        "+0217e9e2a1aca300a7011acaadf60af94252875568373546895f227c050d48aac5",
                        "+02b3b3233c171a122f88c1dbe44539dfefb36530ca3ec04163aef9f448a1823795",
                        "+03a3013f144160e1964b97e78117571e571a631f0042efcd0de309c7159c7886c8",
                        "+02fb475ef881b8f56e00407095a87319934c34467db11d3230e54d9328c6cddbe5",
                        "+03ab9cc2c5364f1676a94b2b5ff3fbc3705e8ce94c6e7e4712890905addf765a3f",
                        "+024be9e731a63f86b56e5f48dbdfb3443a0628c82ea308ee4c88d3fcbe3183eb9d",
                        "+0371b8fd17fb1f31095e8a1586bbe29e205904c9100de07c84090a423929a20dcf",
                        "+02cc09a7c5560db72e312f58a9f5ca4b60b5109efc5ce9dd58a116fa16516bb493",
                        "+02145fbe9309ebb1547eb332686efb4d8b6e2aaa1fe636663bf6ab1000e5cf72d3",
                        "+0274966781d4d23f8991530b33bdb051905cde809ae52e58e45cfd1bc8f6f70cc6",
                        "+0347288f8db9be069415c6c97fd4825867f4bd9b9f78557e8aa1244890beb85001",
                        "+035359097c405e90516be78104de0ca17001da2826397e0937b8b1e8e613fff352",
                        "+021aa343234514f8fdaf5e668bdc822a42805382567fa2ca9a5e06e92065f5658a",
                        "+033a28a0a9592952336918ddded08dd55503b82852fe67df1d358f07a575910844",
                        "+02747bec17b02cc09345c8c0dbeb09bff2db74d1c355135e10af0001eb1dc00265",
                    ],
                },
            },
        };

        multisignatureTest = {
            min: 15,
            lifetime: 72,
            keysgroup: [
                "034a7aca6841cfbdc688f09d55345f21c7ffbd1844693fa68d607fc94f729cbbea",
                "02fd6743ddfdc7c5bac24145e449c2e4f2d569b5297dd7bf088c3bc219f582a2f0",
                "02f9c51812f4be127b9f1f21cb4e146eca6aecc85739a243db0f1064981deda216",
                "0214d60ca95cd87a097ed6e6e42281acb68ae1815c8f494b8ff18d24dc9e072171",
                "02a14634e04e80b05acd56bc361af98498d76fbf5233f8d62773ceaa07172ddaa6",
                "021a9ba0e72f02b8fa7bad386582ec1d6c05b7664c892bf2a86035a85350f37203",
                "02e3ba373c6c352316b748e75358ead36504b0ef5139d215fb6a83a330c4eb60d5",
                "0309039bfa18d6fd790edb79438783b27fbcab06040a2fdaa66fb81ad53ca8db5f",
                "0393d12aff5962fa9065487959719a81c5d991e7c48a823039acd9254c2b673841",
                "03d3265264f06fe1dd752798403a73e537eb461fc729c83a84b579e8434adfe7c4",
                "02acfa496a6c12cb9acc3219993b17c62d19f4b570996c12a37d6e89eaa9716859",
                "03136f2101f1767b0d63d9545410bcaf3a941b2b6f06851093f3c679e0d31ca1cd",
                "02e6ec3941be86177bf0b998589c07da1b73e990466fdaee347c972c10f61b3797",
                "037dcd05d921a9f2ddd11960fec2ea9904fc55cad030549a6c5f5a41b2e35e56d2",
                "03206f7ae26f14cffb62b8c28b5e632952cdeb84b7c74ac0c2198b08bd84ee4f23",
            ],
        };

        handler = TransactionHandlerRegistry.get(transaction.type);
        instance = Transactions.TransactionFactory.fromData(transaction);
    });

    describe("canApply", () => {
        it("should be true", () => {
            delete wallet.multisignature;
            expect(handler.canBeApplied(instance, wallet)).toBeTrue();
        });

        it("should be false if the wallet already has multisignatures", () => {
            wallet.verifySignatures = jest.fn(() => true);
            wallet.multisignature = multisignatureTest;

            expect(() => handler.canBeApplied(instance, wallet)).toThrow(MultiSignatureAlreadyRegisteredError);
        });

        it("should be false if failure to verify signatures", () => {
            wallet.verifySignatures = jest.fn(() => false);
            delete wallet.multisignature;

            expect(() => handler.canBeApplied(instance, wallet)).toThrow(InvalidMultiSignatureError);
        });

        it("should be false if failure to verify signatures in asset", () => {
            wallet.verifySignatures = jest.fn(() => false);
            delete wallet.multisignature;

            expect(() => handler.canBeApplied(instance, wallet)).toThrow(InvalidMultiSignatureError);
        });

        it("should be false if the number of keys is less than minimum", () => {
            delete wallet.multisignature;

            wallet.verifySignatures = jest.fn(() => true);
            Transactions.Transaction.verifySecondSignature = jest.fn(() => true);

            instance.data.asset.multisignature.keysgroup.splice(0, 5);
            expect(() => handler.canBeApplied(instance, wallet)).toThrow(MultiSignatureMinimumKeysError);
        });

        it("should be false if the number of keys does not equal the signature count", () => {
            delete wallet.multisignature;

            wallet.verifySignatures = jest.fn(() => true);
            Transactions.Transaction.verifySecondSignature = jest.fn(() => true);

            instance.data.signatures.splice(0, 5);
            expect(() => handler.canBeApplied(instance, wallet)).toThrow(MultiSignatureKeyCountMismatchError);
        });

        it("should be false if wallet has insufficient funds", () => {
            delete wallet.multisignature;
            wallet.balance = Utils.BigNumber.ZERO;

            expect(() => handler.canBeApplied(instance, wallet)).toThrow(InsufficientBalanceError);
        });
    });

    describe("apply", () => {
        it("should be ok", () => {
            wallet.multisignature = null;

            expect(wallet.multisignature).toBeNull();

            handler.applyToSender(instance, wallet);

            expect(wallet.multisignature).toEqual(transaction.asset.multisignature);
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
            expect(handler.canBeApplied(instance, wallet)).toBeTrue();
        });

        it("should be false", () => {
            instance.data.senderPublicKey = "a".repeat(66);
            expect(() => handler.canBeApplied(instance, wallet)).toThrow(SenderWalletMismatchError);
        });

        it("should be false if wallet has insufficient funds", () => {
            wallet.balance = Utils.BigNumber.ZERO;
            expect(() => handler.canBeApplied(instance, wallet)).toThrow(InsufficientBalanceError);
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
            expect(handler.canBeApplied(instance, wallet)).toBeTrue();
        });

        it("should be false", () => {
            instance.data.senderPublicKey = "a".repeat(66);
            expect(() => handler.canBeApplied(instance, wallet)).toThrow(SenderWalletMismatchError);
        });

        it("should be false if wallet has insufficient funds", () => {
            wallet.balance = Utils.BigNumber.ZERO;
            expect(() => handler.canBeApplied(instance, wallet)).toThrow(InsufficientBalanceError);
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
            expect(handler.canBeApplied(instance, wallet)).toBeTrue();
        });

        it("should be false if wallet has insufficient funds", () => {
            wallet.balance = Utils.BigNumber.ZERO;
            expect(() => handler.canBeApplied(instance, wallet)).toThrow(InsufficientBalanceError);
        });

        it("should be false if wallet has insufficient funds send all payouts", () => {
            wallet.balance = Utils.BigNumber.ZERO;
            expect(() => handler.canBeApplied(instance, wallet)).toThrow(InsufficientBalanceError);
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
            expect(handler.canBeApplied(instance, wallet)).toBeTrue();
        });

        it.skip("should be false if wallet has no registered username", () => {
            wallet.username = null;
            expect(() => handler.canBeApplied(instance, wallet)).toThrow(WalletNoUsernameError);
        });

        it("should be false if wallet has insufficient funds", () => {
            wallet.balance = Utils.BigNumber.ZERO;
            expect(() => handler.canBeApplied(instance, wallet)).toThrow(InsufficientBalanceError);
        });
    });
});
