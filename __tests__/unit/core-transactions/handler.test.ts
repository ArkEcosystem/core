import "jest-extended";

import { State } from "@arkecosystem/core-interfaces";
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
    VotedForResignedDelegateError,
    WalletAlreadyResignedError,
    WalletIsAlreadyDelegateError,
    WalletNotADelegateError,
} from "../../../packages/core-transactions/src/errors";
import { TransactionHandler } from "../../../packages/core-transactions/src/handlers/transaction";
import { Handlers } from "../../../packages/core-transactions/src/index";
import { TransactionFactory } from "../../helpers";
import { transaction as transactionFixture } from "../crypto/transactions/__fixtures__/transaction";

let senderWallet: Wallets.Wallet;
let recipientWallet: Wallets.Wallet;
let transaction: Interfaces.ITransactionData;
let transactionWithSecondSignature: Interfaces.ITransactionData;
let handler: TransactionHandler;
let instance: Interfaces.ITransaction;
let walletManager: State.IWalletManager;

beforeEach(() => {
    Managers.configManager.setFromPreset("testnet");

    walletManager = new Wallets.WalletManager();

    senderWallet = new Wallets.Wallet("ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo");
    senderWallet.balance = Utils.BigNumber.make(4527654310);
    senderWallet.publicKey = "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37";

    recipientWallet = new Wallets.Wallet("AbfQq8iRSf9TFQRzQWo33dHYU7HFMS17Zd");
    recipientWallet.publicKey = "02def27da9336e7fbf63131b8d7e5c9f45b296235db035f1f4242c507398f0f21d";

    walletManager.reindex(senderWallet);
    walletManager.reindex(recipientWallet);

    transaction = TransactionFactory.transfer("AbfQq8iRSf9TFQRzQWo33dHYU7HFMS17Zd", 10000000)
        .withFee(10000000)
        .withPassphrase("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire")
        .createOne();

    transactionWithSecondSignature = TransactionFactory.transfer("AbfQq8iRSf9TFQRzQWo33dHYU7HFMS17Zd", 10000000)
        .withFee(10000000)
        .withSecondPassphrase("venue below waste gather spin cruise title still boost mother flash tuna")
        .withPassphrase("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire")
        .createOne();
});

describe("General Tests", () => {
    beforeEach(() => {
        handler = Handlers.Registry.get(transaction.type);
        instance = Transactions.TransactionFactory.fromData(transaction);
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", () => {
            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).not.toThrow();
        });

        it("should be false if wallet publicKey does not match tx senderPublicKey", () => {
            instance.data.senderPublicKey = "a".repeat(66);
            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toThrow(
                SenderWalletMismatchError,
            );
        });

        it("should be false if the transaction has a second signature but wallet does not", () => {
            instance = Transactions.TransactionFactory.fromData(transactionWithSecondSignature);
            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toThrow(
                UnexpectedSecondSignatureError,
            );
        });

        it("should be false if the wallet has a second public key but the transaction second signature does not match", () => {
            senderWallet.setAttribute("secondPublicKey", "invalid-public-key");
            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toThrow(
                InvalidSecondSignatureError,
            );
        });

        it("should be false if wallet has not enough balance", () => {
            // 1 arktoshi short
            senderWallet.balance = transaction.amount.plus(transaction.fee).minus(1);
            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toThrow(
                InsufficientBalanceError,
            );
        });

        it("should be true even with publicKey case mismatch", () => {
            transaction.senderPublicKey = transaction.senderPublicKey.toUpperCase();
            senderWallet.publicKey = senderWallet.publicKey.toLowerCase();
            instance = Transactions.TransactionFactory.fromData(transaction);
            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).not.toThrow();
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
            senderWallet.nonce = Utils.BigNumber.make(1);

            handler.revert(instance, walletManager);
            expect(senderWallet.balance).toEqual(
                Utils.BigNumber.make(senderBalance)
                    .plus(instance.data.amount)
                    .plus(instance.data.fee),
            );

            expect(senderWallet.nonce.isZero()).toBeTrue();
            expect(recipientWallet.balance).toEqual(Utils.BigNumber.make(recipientBalance).minus(instance.data.amount));
        });

        it("should not fail due to case mismatch", () => {
            senderWallet.nonce = Utils.BigNumber.make(1);

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

            expect(senderWallet.nonce.isZero()).toBeTrue();
            expect(recipientWallet.balance).toEqual(Utils.BigNumber.make(recipientBalance).minus(instance.data.amount));
        });
    });

    describe("dynamicFees", () => {
        const transaction = TransactionFactory.transfer("AFzQCx5YpGg5vKMBg4xbuYbqkhvMkKfKe5")
            .withNonce(Utils.BigNumber.make(0))
            .withNetwork("testnet")
            .withPassphrase("secret")
            .build()[0];

        it("should correctly calculate the transaction fee based on transaction size and addonBytes", () => {
            const addonBytes = 137;
            const handler = Handlers.Registry.get(transaction.type);

            expect(handler.dynamicFee(transaction, addonBytes, 3)).toEqual(
                Utils.BigNumber.make(137 + transaction.serialized.length / 2).times(3),
            );

            expect(handler.dynamicFee(transaction, addonBytes, 6)).toEqual(
                Utils.BigNumber.make(137 + transaction.serialized.length / 2).times(6),
            );

            expect(handler.dynamicFee(transaction, 0, 9)).toEqual(
                Utils.BigNumber.make(transaction.serialized.length / 2).times(9),
            );
        });

        it("should default satoshiPerByte to 1 if value provided is <= 0", () => {
            const handler = Handlers.Registry.get(transaction.type);

            expect(handler.dynamicFee(transaction, 0, -50)).toEqual(handler.dynamicFee(transaction, 0, 1));
            expect(handler.dynamicFee(transaction, 0, 0)).toEqual(handler.dynamicFee(transaction, 0, 1));
        });
    });
});

describe("TransferTransaction", () => {
    beforeEach(() => {
        handler = Handlers.Registry.get(transaction.type);
        instance = Transactions.TransactionFactory.fromData(transaction);
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", () => {
            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).not.toThrow();
        });

        it("should throw", () => {
            instance.data.senderPublicKey = "a".repeat(66);
            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toThrow(
                SenderWalletMismatchError,
            );
        });
    });
});

describe("SecondSignatureRegistrationTransaction", () => {
    beforeEach(() => {
        senderWallet = new Wallets.Wallet("AbfQq8iRSf9TFQRzQWo33dHYU7HFMS17Zd");
        senderWallet.balance = Utils.BigNumber.make("6453530000000");
        senderWallet.publicKey = "02def27da9336e7fbf63131b8d7e5c9f45b296235db035f1f4242c507398f0f21d";
        senderWallet.forgetAttribute("secondPublicKey");

        walletManager.reindex(senderWallet);

        transaction = TransactionFactory.secondSignature(
            "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire",
        )
            .withFee(500000000)
            .withPassphrase("venue below waste gather spin cruise title still boost mother flash tuna")
            .createOne();

        handler = Handlers.Registry.get(transaction.type);
        instance = Transactions.TransactionFactory.fromData(transaction);
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", () => {
            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).not.toThrow();
        });

        it("should throw if wallet already has a second signature", () => {
            senderWallet.setAttribute(
                "secondPublicKey",
                "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
            );

            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toThrow(
                SecondSignatureAlreadyRegisteredError,
            );
        });

        it("should throw if wallet has insufficient funds", () => {
            senderWallet.balance = Utils.BigNumber.ZERO;

            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toThrow(
                InsufficientBalanceError,
            );
        });
    });

    describe("apply", () => {
        it("should not throw with second signature registration", () => {
            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).not.toThrow();

            handler.apply(instance, walletManager);
            expect(senderWallet.getAttribute("secondPublicKey")).toBe(
                "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
            );
        });

        it("should be invalid to apply a second signature registration twice", () => {
            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).not.toThrow();

            handler.apply(instance, walletManager);
            expect(senderWallet.getAttribute("secondPublicKey")).toBe(
                "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
            );

            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toThrow(
                SecondSignatureAlreadyRegisteredError,
            );
        });
    });

    describe("revert", () => {
        it("should be ok", () => {
            expect(senderWallet.getAttribute("secondPublicKey")).toBeUndefined();
            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).not.toThrow();

            handler.apply(instance, walletManager);
            expect(senderWallet.getAttribute("secondPublicKey")).toBe(
                "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
            );

            handler.revert(instance, walletManager);
            expect(senderWallet.getAttribute("secondPublicKey")).toBeUndefined();
        });
    });
});

describe("DelegateRegistrationTransaction", () => {
    beforeEach(() => {
        transaction = TransactionFactory.delegateRegistration("dummy")
            .withFee(10000000)
            .withPassphrase("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire")
            .createOne();

        handler = Handlers.Registry.get(transaction.type);
        instance = Transactions.TransactionFactory.fromData(transaction);
    });

    describe("canApply", () => {
        it("should not throw", () => {
            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).not.toThrow();
        });

        it("should throw if wallet already registered a username", () => {
            senderWallet.setAttribute("delegate", { username: "dummy" });

            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toThrow(
                WalletIsAlreadyDelegateError,
            );
        });

        it("should throw if wallet has insufficient funds", () => {
            walletManager.forgetByUsername("dummy");
            senderWallet.forgetAttribute("delegate");
            senderWallet.balance = Utils.BigNumber.ZERO;

            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toThrow(
                InsufficientBalanceError,
            );
        });
    });

    describe("apply", () => {
        it("should set username", () => {
            handler.apply(instance, walletManager);
            expect(senderWallet.getAttribute("delegate.username")).toBe("dummy");
        });
    });

    describe("revert", () => {
        it("should unset username", () => {
            senderWallet.nonce = Utils.BigNumber.make(1);

            handler.revert(instance, walletManager);

            expect(senderWallet.nonce.isZero()).toBeTrue();
            expect(senderWallet.getAttribute("delegate.username")).toBeUndefined();
        });
    });
});

describe("VoteTransaction", () => {
    let voteTransaction: Interfaces.ITransactionData;
    let unvoteTransaction: Interfaces.ITransactionData;
    let delegateWallet: State.IWallet;

    beforeEach(() => {
        senderWallet.forgetAttribute("vote");

        delegateWallet = new Wallets.Wallet("ARAibxGqLQJTo1bWMJfu5fCc88rdWWjqgv");
        delegateWallet.publicKey = "038082dad560a22ea003022015e3136b21ef1ffd9f2fd50049026cbe8e2258ca17";
        delegateWallet.setAttribute("delegate", { username: "test" });

        walletManager.reindex(senderWallet);
        walletManager.reindex(delegateWallet);

        voteTransaction = TransactionFactory.vote("038082dad560a22ea003022015e3136b21ef1ffd9f2fd50049026cbe8e2258ca17")
            .withFee(100000000)
            .withPassphrase("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire")
            .createOne();

        unvoteTransaction = TransactionFactory.unvote(
            "038082dad560a22ea003022015e3136b21ef1ffd9f2fd50049026cbe8e2258ca17",
        )
            .withFee(100000000)
            .withPassphrase("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire")
            .createOne();

        handler = Handlers.Registry.get(voteTransaction.type);
        instance = Transactions.TransactionFactory.fromData(voteTransaction);
    });

    describe("canApply", () => {
        it("should not throw if the vote is valid and the wallet has not voted", () => {
            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).not.toThrow();
        });

        it("should not throw if the unvote is valid and the wallet has voted", () => {
            senderWallet.setAttribute("vote", "038082dad560a22ea003022015e3136b21ef1ffd9f2fd50049026cbe8e2258ca17");
            instance = Transactions.TransactionFactory.fromData(unvoteTransaction);
            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).not.toThrow();
        });

        it("should throw if wallet has already voted", () => {
            senderWallet.setAttribute("vote", "038082dad560a22ea003022015e3136b21ef1ffd9f2fd50049026cbe8e2258ca17");
            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toThrow(
                AlreadyVotedError,
            );
        });

        it("should throw if the asset public key differs from the currently voted one", () => {
            senderWallet.setAttribute("vote", "a310ad026647eed112d1a46145eed58b8c19c67c505a67f1199361a511ce7860c0");
            instance = Transactions.TransactionFactory.fromData(unvoteTransaction);
            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toThrow(
                UnvoteMismatchError,
            );
        });

        it("should throw if unvoting a non-voted wallet", () => {
            instance = Transactions.TransactionFactory.fromData(unvoteTransaction);
            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toThrow(NoVoteError);
        });

        it("should throw if wallet has insufficient funds", () => {
            senderWallet.balance = Utils.BigNumber.ZERO;
            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toThrow(
                InsufficientBalanceError,
            );
        });
    });

    describe("apply", () => {
        describe("vote", () => {
            it("should be ok", () => {
                expect(senderWallet.getAttribute("vote")).toBeUndefined();

                handler.apply(instance, walletManager);
                expect(senderWallet.getAttribute("vote")).not.toBeUndefined();
            });

            it("should not be ok", () => {
                senderWallet.setAttribute("vote", "038082dad560a22ea003022015e3136b21ef1ffd9f2fd50049026cbe8e2258ca17");

                expect(senderWallet.getAttribute("vote")).not.toBeUndefined();

                expect(() => handler.apply(instance, walletManager)).toThrow(AlreadyVotedError);

                expect(senderWallet.getAttribute("vote")).not.toBeUndefined();
            });
        });

        describe("unvote", () => {
            it("should remove the vote from the wallet", () => {
                senderWallet.setAttribute("vote", "038082dad560a22ea003022015e3136b21ef1ffd9f2fd50049026cbe8e2258ca17");

                expect(senderWallet.getAttribute("vote")).not.toBeUndefined();

                instance = Transactions.TransactionFactory.fromData(unvoteTransaction);
                handler.apply(instance, walletManager);

                expect(senderWallet.getAttribute("vote")).toBeUndefined();
            });
        });
    });

    describe("revert", () => {
        describe("vote", () => {
            it("should remove the vote from the wallet", () => {
                senderWallet.setAttribute("vote", "038082dad560a22ea003022015e3136b21ef1ffd9f2fd50049026cbe8e2258ca17");
                senderWallet.nonce = Utils.BigNumber.make(1);

                expect(senderWallet.getAttribute("vote")).not.toBeUndefined();

                handler.revert(instance, walletManager);

                expect(senderWallet.nonce.isZero()).toBeTrue();
                expect(senderWallet.getAttribute("vote")).toBeUndefined();
            });
        });

        describe("unvote", () => {
            it("should add the vote to the wallet", () => {
                senderWallet.nonce = Utils.BigNumber.make(1);

                expect(senderWallet.getAttribute("vote")).toBeUndefined();

                instance = Transactions.TransactionFactory.fromData(unvoteTransaction);
                handler.revert(instance, walletManager);

                expect(senderWallet.nonce.isZero()).toBeTrue();
                expect(senderWallet.getAttribute("vote")).toBe(
                    "038082dad560a22ea003022015e3136b21ef1ffd9f2fd50049026cbe8e2258ca17",
                );
            });
        });
    });
});

describe("MultiSignatureRegistrationTransaction", () => {
    beforeEach(() => {
        transaction = TransactionFactory.multiSignature().create()[0];

        handler = Handlers.Registry.get(transaction.type);
        instance = Transactions.TransactionFactory.fromData(transaction);

        senderWallet = new Wallets.Wallet("AbfQq8iRSf9TFQRzQWo33dHYU7HFMS17Zd");
        senderWallet.balance = Utils.BigNumber.make(100390000000);
        senderWallet.publicKey = transaction.senderPublicKey;

        const multiSignatureAddress = Identities.Address.fromMultiSignatureAsset(instance.data.asset.multiSignature);
        recipientWallet = new Wallets.Wallet(multiSignatureAddress);
        recipientWallet.balance = Utils.BigNumber.make(0);

        walletManager.reindex(senderWallet);
        walletManager.reindex(recipientWallet);
    });

    describe("canApply", () => {
        it("should not throw", () => {
            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).not.toThrow();
        });

        it("should throw if the wallet already has multisignatures", () => {
            recipientWallet.setAttribute("multiSignature", instance.data.asset.multiSignature);
            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toThrow(
                MultiSignatureAlreadyRegisteredError,
            );
        });

        it("should throw if failure to verify signatures", () => {
            senderWallet.verifySignatures = jest.fn(() => false);
            senderWallet.forgetAttribute("multiSignature");

            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toThrow(
                InvalidMultiSignatureError,
            );
        });

        it("should throw if failure to verify signatures in asset", () => {
            instance.data.signatures[0] = instance.data.signatures[0].replace("00", "02");
            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toThrow(
                InvalidMultiSignatureError,
            );
        });

        it("should throw if the number of keys is less than minimum", () => {
            senderWallet.forgetAttribute("multiSignature");

            senderWallet.verifySignatures = jest.fn(() => true);
            Transactions.Verifier.verifySecondSignature = jest.fn(() => true);

            instance.data.asset.multiSignature.publicKeys.splice(0, 5);
            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toThrow(
                MultiSignatureMinimumKeysError,
            );
        });

        it("should throw if the number of keys does not equal the signature count", () => {
            senderWallet.forgetAttribute("multiSignature");

            senderWallet.verifySignatures = jest.fn(() => true);
            Transactions.Verifier.verifySecondSignature = jest.fn(() => true);

            instance.data.signatures.splice(0, 2);
            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toThrow(
                MultiSignatureKeyCountMismatchError,
            );
        });

        it("should throw if wallet has insufficient funds", () => {
            senderWallet.forgetAttribute("multiSignature");
            senderWallet.balance = Utils.BigNumber.ZERO;

            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toThrow(
                InsufficientBalanceError,
            );
        });
    });

    describe("apply", () => {
        it("should be ok", () => {
            recipientWallet.forgetAttribute("multiSignature");

            expect(senderWallet.hasAttribute("multiSignature")).toBeFalse();
            expect(recipientWallet.hasAttribute("multiSignature")).toBeFalse();

            expect(senderWallet.balance).toEqual(Utils.BigNumber.make(100390000000));
            expect(recipientWallet.balance).toEqual(Utils.BigNumber.ZERO);

            handler.apply(instance, walletManager);

            expect(senderWallet.balance).toEqual(Utils.BigNumber.make(98390000000));
            expect(recipientWallet.balance).toEqual(Utils.BigNumber.ZERO);

            expect(senderWallet.hasAttribute("multiSignature")).toBeFalse();
            expect(recipientWallet.getAttribute("multiSignature")).toEqual(transaction.asset.multiSignature);
        });
    });

    describe("revert", () => {
        it("should be ok", () => {
            senderWallet.nonce = Utils.BigNumber.make(1);

            handler.revert(instance, walletManager);

            expect(senderWallet.nonce.isZero()).toBeTrue();
            expect(senderWallet.hasMultiSignature()).toBeFalse();
            expect(recipientWallet.hasMultiSignature()).toBeFalse();
        });
    });
});

describe("Ipfs", () => {
    beforeAll(() => {
        Managers.configManager.setFromPreset("testnet");
    });

    beforeEach(() => {
        transaction = TransactionFactory.ipfs("QmR45FmbVVrixReBwJkhEKde2qwHYaQzGxu4ZoDeswuF9w").createOne();

        handler = Handlers.Registry.get(transaction.type);
        instance = Transactions.TransactionFactory.fromData(transaction);
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", () => {
            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).not.toThrow();
        });

        it("should throw if wallet has insufficient funds", () => {
            senderWallet.balance = Utils.BigNumber.ZERO;

            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toThrow(
                InsufficientBalanceError,
            );
        });
    });

    describe("apply", () => {
        it("should apply ipfs transaction", () => {
            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).not.toThrow();

            const balanceBefore = senderWallet.balance;

            handler.apply(instance, walletManager);

            expect(
                senderWallet.getAttribute<State.IWalletIpfsAttributes>("ipfs.hashes")[transaction.asset.ipfs],
            ).toBeTrue();
            expect(senderWallet.balance).toEqual(balanceBefore.minus(transaction.fee));
        });
    });

    describe("revert", () => {
        it("should be ok", () => {
            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).not.toThrow();

            const balanceBefore = senderWallet.balance;

            handler.apply(instance, walletManager);

            expect(senderWallet.balance).toEqual(balanceBefore.minus(transaction.fee));
            expect(
                senderWallet.getAttribute<State.IWalletIpfsAttributes>("ipfs.hashes")[transaction.asset.ipfs],
            ).toBeTrue();

            handler.revert(instance, walletManager);

            expect(senderWallet.getAttribute("ipfs.hashes")[transaction.asset.ipfs]).toBeFalsy();
            expect(senderWallet.balance).toEqual(balanceBefore);
        });
    });
});

describe.skip("TimelockTransferTransaction", () => {
    beforeEach(() => {
        transaction = transactionFixture;
        senderWallet.balance = transaction.amount.plus(transaction.fee);
        handler = Handlers.Registry.get(transaction.type);
        instance = Transactions.TransactionFactory.fromData(transaction);
    });

    describe("canApply", () => {
        it("should not throw", () => {
            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).not.toThrow();
        });

        it("should throw", () => {
            instance.data.senderPublicKey = "a".repeat(66);
            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toThrow(
                SenderWalletMismatchError,
            );
        });

        it("should throw if wallet has insufficient funds", () => {
            senderWallet.balance = Utils.BigNumber.ZERO;
            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toThrow(
                InsufficientBalanceError,
            );
        });
    });
});

describe("MultiPaymentTransaction", () => {
    beforeEach(() => {
        transaction = TransactionFactory.multiPayment([
            {
                amount: "10",
                recipientId: "AbfQq8iRSf9TFQRzQWo33dHYU7HFMS17Zd",
            },
            {
                amount: "20",
                recipientId: "AbfQq8iRSf9TFQRzQWo33dHYU7HFMS17Zd",
            },
            {
                amount: "30",
                recipientId: "AbfQq8iRSf9TFQRzQWo33dHYU7HFMS17Zd",
            },
            {
                amount: "40",
                recipientId: "AbfQq8iRSf9TFQRzQWo33dHYU7HFMS17Zd",
            },
            {
                amount: "50",
                recipientId: "AbfQq8iRSf9TFQRzQWo33dHYU7HFMS17Zd",
            },
        ]).createOne();

        const totalPaymentsAmount = transaction.asset.payments.reduce((a, p) => a.plus(p.amount), Utils.BigNumber.ZERO);
        senderWallet.balance = totalPaymentsAmount.plus(transaction.fee);
        handler = Handlers.Registry.get(transaction.type);

        instance = Transactions.TransactionFactory.fromData(transaction);
    });

    describe("canApply", () => {
        it("should not throw", () => {
            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).not.toThrow();
        });

        it("should throw if wallet has insufficient funds", () => {
            senderWallet.balance = Utils.BigNumber.ZERO;
            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toThrow(
                InsufficientBalanceError,
            );
        });

        it("should throw if wallet has insufficient funds send all payouts", () => {
            senderWallet.balance = Utils.BigNumber.make(150); // short by the fee
            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toThrow(
                InsufficientBalanceError,
            );
        });
    });
});

describe("DelegateResignationTransaction", () => {
    let voteTransaction;

    beforeEach(() => {
        transaction = TransactionFactory.delegateResignation()
            .withPassphrase("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire")
            .createOne();

        voteTransaction = TransactionFactory.vote("03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37")
            .withPassphrase("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire")
            .createOne();

        senderWallet.setAttribute("delegate", { username: "tiredDelegate" });
        senderWallet.forgetAttribute("delegate.resigned");

        walletManager.reindex(senderWallet);

        handler = Handlers.Registry.get(transaction.type);
        instance = Transactions.TransactionFactory.fromData(transaction);
    });

    describe("canApply", () => {
        it("should not throw if wallet is a delegate", () => {
            senderWallet.setAttribute("delegate", {});
            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).not.toThrow();
        });

        it("should throw if wallet is not a delegate", () => {
            senderWallet.forgetAttribute("delegate");
            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toThrow(
                WalletNotADelegateError,
            );
        });

        it("should throw if wallet has insufficient funds", () => {
            senderWallet.balance = Utils.BigNumber.ZERO;
            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toThrow(
                InsufficientBalanceError,
            );
        });
    });

    describe("apply", () => {
        it("should apply delegate resignation", () => {
            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).not.toThrow();

            handler.apply(instance, walletManager);
            expect(senderWallet.getAttribute<boolean>("delegate.resigned")).toBeTrue();
        });

        it("should fail when already resigned", () => {
            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).not.toThrow();

            handler.apply(instance, walletManager);
            expect(senderWallet.getAttribute<boolean>("delegate.resigned")).toBeTrue();

            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toThrow(
                WalletAlreadyResignedError,
            );
        });

        it("should fail when not a delegate", () => {
            senderWallet.forgetAttribute("delegate");

            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toThrow(
                WalletNotADelegateError,
            );
        });

        it("should fail when voting for a resigned delegate", () => {
            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).not.toThrow();

            handler.apply(instance, walletManager);
            expect(senderWallet.getAttribute<boolean>("delegate.resigned")).toBeTrue();

            const vote = Transactions.TransactionFactory.fromData(voteTransaction);
            const voteHandler = Handlers.Registry.get(vote.type);

            expect(() => voteHandler.throwIfCannotBeApplied(vote, senderWallet, walletManager)).toThrow(
                VotedForResignedDelegateError,
            );
        });
    });

    describe("revert", () => {
        it("should be ok", () => {
            expect(senderWallet.hasAttribute("delegate.resigned")).toBeFalse();
            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).not.toThrow();

            handler.apply(instance, walletManager);
            expect(senderWallet.getAttribute<boolean>("delegate.resigned")).toBeTrue();
            handler.revert(instance, walletManager);
            expect(senderWallet.getAttribute<boolean>("delegate.resigned")).toBeFalsy();
        });
    });
});
