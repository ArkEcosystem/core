import "jest-extended";

import { State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Wallets } from "@arkecosystem/core-state";
import { formatTimestamp } from "@arkecosystem/core-utils";
import { Crypto, Identities, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import {
    AlreadyVotedError,
    HtlcLockExpiredError,
    HtlcLockNotExpiredError,
    HtlcLockTransactionNotFoundError,
    HtlcSecretHashMismatchError,
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
import { Handlers, Interfaces as TransactionsInterfaces } from "../../../packages/core-transactions/src/index";
import { TransactionFactory } from "../../helpers";

const { UnixTimestamp, BlockHeight } = Transactions.enums.HtlcLockExpirationType;

const mockLastBlockData: Partial<Interfaces.IBlockData> = { timestamp: Crypto.Slots.getTime(), height: 4 };

const makeUnixTimestamp = (secondsRelativeToLastBlock = 9) =>
    formatTimestamp(mockLastBlockData.timestamp).unix + secondsRelativeToLastBlock;
const makeBlockHeightTimestamp = (heightRelativeToLastBlock = 2) =>
    mockLastBlockData.height + heightRelativeToLastBlock;
const makeExpiredTimestamp = type => (type === UnixTimestamp ? makeUnixTimestamp(-9) : makeBlockHeightTimestamp(-2));
const makeNotExpiredTimestamp = type => (type === UnixTimestamp ? makeUnixTimestamp(99) : makeBlockHeightTimestamp(9));

let mockTransaction;
jest.mock("@arkecosystem/core-container", () => {
    return {
        app: {
            getConfig: () => ({
                getMilestone: () => ({
                    epoch: "2017-03-21T13:00:00.000Z",
                }),
            }),
            resolvePlugin: name => {
                switch (name) {
                    case "database":
                        return {
                            transactionsBusinessRepository: {
                                findById: id => mockTransaction,
                            },
                        };
                    case "state":
                        return {
                            getStore: () => ({
                                getLastBlock: () => ({ data: mockLastBlockData }),
                            }),
                        };
                    default:
                        return {};
                }
            },
        },
    };
});

let senderWallet: Wallets.Wallet;
let recipientWallet: Wallets.Wallet;
let transaction: Interfaces.ITransactionData;
let transactionWithSecondSignature: Interfaces.ITransactionData;
let handler: TransactionsInterfaces.ITransactionHandler;
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
        it("should be ok", async () => {
            const senderBalance = senderWallet.balance;
            const recipientBalance = recipientWallet.balance;
            senderWallet.nonce = Utils.BigNumber.make(1);

            await handler.revert(instance, walletManager);
            expect(senderWallet.balance).toEqual(
                Utils.BigNumber.make(senderBalance)
                    .plus(instance.data.amount)
                    .plus(instance.data.fee),
            );

            expect(senderWallet.nonce.isZero()).toBeTrue();
            expect(recipientWallet.balance).toEqual(Utils.BigNumber.make(recipientBalance).minus(instance.data.amount));
        });

        it("should not fail due to case mismatch", async () => {
            senderWallet.nonce = Utils.BigNumber.make(1);

            transaction.senderPublicKey = transaction.senderPublicKey.toUpperCase();
            const instance = Transactions.TransactionFactory.fromData(transaction);

            const senderBalance = senderWallet.balance;
            const recipientBalance = recipientWallet.balance;

            await handler.revert(instance, walletManager);
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

describe("MultiPaymentTransaction", () => {
    beforeEach(() => {
        transaction = TransactionFactory.multiPayment([
            {
                amount: "10",
                recipientId: "ARYJmeYHSUTgbxaiqsgoPwf6M3CYukqdKN",
            },
            {
                amount: "20",
                recipientId: "AFyjB5jULQiYNsp37wwipCm9c7V1xEzTJD",
            },
            {
                amount: "30",
                recipientId: "AJwD3UJM7UESFnP1fsKYr4EX9Gc1EJNSqm",
            },
            {
                amount: "40",
                recipientId: "AUsi9ZcFkcwG7WMpRE121TR4HaTjnAP7qD",
            },
            {
                amount: "50",
                recipientId: "ARugw4i18i2pVnYZEMWKJj2mAnQQ97wuat",
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

    describe("apply", () => {
        it("should be ok", () => {
            const senderBalance = senderWallet.balance;
            const totalPaymentsAmount = instance.data.asset.payments.reduce(
                (prev, curr) => prev.plus(curr.amount),
                Utils.BigNumber.ZERO,
            );

            handler.apply(instance, walletManager);

            expect(senderWallet.balance).toEqual(
                Utils.BigNumber.make(senderBalance)
                    .minus(totalPaymentsAmount)
                    .minus(instance.data.fee),
            );

            for (const { recipientId, amount } of instance.data.asset.payments) {
                const paymentRecipientWallet = walletManager.findByAddress(recipientId);
                expect(paymentRecipientWallet.balance).toEqual(amount);
            }
        });
    });

    describe("revert", () => {
        it("should be ok", async () => {
            const senderBalance = senderWallet.balance;
            senderWallet.nonce = Utils.BigNumber.make(1);

            for (const { recipientId, amount } of instance.data.asset.payments) {
                const paymentRecipientWallet = walletManager.findByAddress(recipientId);
                paymentRecipientWallet.balance = amount;
            }
            const totalPaymentsAmount = instance.data.asset.payments.reduce(
                (prev, curr) => prev.plus(curr.amount),
                Utils.BigNumber.ZERO,
            );

            handler.revert(instance, walletManager);
            expect(senderWallet.balance).toEqual(
                Utils.BigNumber.make(senderBalance)
                    .plus(totalPaymentsAmount)
                    .plus(instance.data.fee),
            );

            expect(senderWallet.nonce.isZero()).toBeTrue();
            expect(recipientWallet.balance).toEqual(Utils.BigNumber.ZERO);
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

describe.each([UnixTimestamp, BlockHeight])("Htlc lock - expiration type %i", expirationType => {
    const htlcLockAsset = {
        secretHash: "0f128d401958b1b30ad0d10406f47f9489321017b4614e6cb993fc63913c5454",
        expiration: {
            type: expirationType,
            value: makeNotExpiredTimestamp(expirationType),
        },
    };

    beforeAll(() => {
        Managers.configManager.setFromPreset("testnet");
    });

    beforeEach(() => {
        transaction = TransactionFactory.htlcLock(htlcLockAsset)
            .withPassphrase("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire")
            .createOne();

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
        it("should apply htlc lock transaction", () => {
            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).not.toThrow();

            const balanceBefore = senderWallet.balance;

            handler.apply(instance, walletManager);

            expect(senderWallet.getAttribute("htlc.locks", {})[transaction.id]).toBeDefined();
            expect(senderWallet.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO)).toEqual(transaction.amount);
            expect(senderWallet.balance).toEqual(balanceBefore.minus(transaction.fee).minus(transaction.amount));
        });
    });

    describe("revert", () => {
        it("should be ok", () => {
            expect(() => handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).not.toThrow();

            const balanceBefore = senderWallet.balance;

            handler.apply(instance, walletManager);

            expect(senderWallet.getAttribute("htlc.locks", {})[transaction.id]).toBeDefined();
            expect(senderWallet.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO)).toEqual(transaction.amount);
            expect(senderWallet.balance).toEqual(balanceBefore.minus(transaction.fee).minus(transaction.amount));

            handler.revert(instance, walletManager);

            expect(senderWallet.getAttribute("htlc.locks", {})[transaction.id]).toBeUndefined();
            expect(senderWallet.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO)).toEqual(Utils.BigNumber.ZERO);
            expect(senderWallet.balance).toEqual(balanceBefore);
        });
    });
});

describe.each([UnixTimestamp, BlockHeight])("Htlc claim - expiration type %i", expirationType => {
    const lockPassphrase = "craft imitate step mixture patch forest volcano business charge around girl confirm";
    const lockKeys = Identities.Keys.fromPassphrase(lockPassphrase);
    const claimPassphrase = "fatal hat sail asset chase barrel pluck bag approve coral slab bright";
    const claimKeys = Identities.Keys.fromPassphrase(claimPassphrase);

    let lockWallet;
    let claimWallet;

    let htlcClaimAsset;

    let lockTransaction: Interfaces.ITransactionData;

    let pool: Partial<TransactionPool.IConnection>;

    beforeAll(() => {
        Managers.configManager.setFromPreset("testnet");
    });

    beforeEach(() => {
        walletManager = new Wallets.WalletManager();
        pool = { walletManager };

        lockWallet = new Wallets.Wallet(Identities.Address.fromPublicKey(lockKeys.publicKey, 23));
        lockWallet.publicKey = lockKeys.publicKey;
        lockWallet.balance = Utils.BigNumber.make(4527654310);

        claimWallet = new Wallets.Wallet(Identities.Address.fromPublicKey(claimKeys.publicKey, 23));
        claimWallet.publicKey = claimKeys.publicKey;

        walletManager.reindex(lockWallet);
        walletManager.reindex(claimWallet);

        const amount = 6 * 1e8;
        const secret = "my secret that should be 32bytes";
        const secretHash = Crypto.HashAlgorithms.sha256(secret).toString("hex");
        const htlcLockAsset = {
            secretHash,
            expiration: {
                type: expirationType,
                value: makeNotExpiredTimestamp(expirationType),
            },
        };
        lockTransaction = TransactionFactory.htlcLock(htlcLockAsset, claimWallet.address, amount)
            .withPassphrase(lockPassphrase)
            .createOne();

        htlcClaimAsset = {
            lockTransactionId: lockTransaction.id,
            unlockSecret: secret,
        };

        lockWallet.setAttribute("htlc.locks", { [lockTransaction.id]: lockTransaction });
        lockWallet.setAttribute("htlc.lockedBalance", Utils.BigNumber.make(amount));
        walletManager.reindex(lockWallet);

        transaction = TransactionFactory.htlcClaim(htlcClaimAsset)
            .withPassphrase(claimPassphrase)
            .createOne();

        handler = Handlers.Registry.get(transaction.type);
        instance = Transactions.TransactionFactory.fromData(transaction);
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", () => {
            expect(() => handler.throwIfCannotBeApplied(instance, claimWallet, walletManager)).not.toThrow();
        });

        it("should throw if no wallet has a lock with associated transaction id", () => {
            walletManager.forgetByIndex(State.WalletIndexes.Locks, lockTransaction.id);

            expect(() => handler.throwIfCannotBeApplied(instance, claimWallet, walletManager)).toThrow(
                HtlcLockTransactionNotFoundError,
            );
        });

        it("should throw if secret hash does not match", () => {
            transaction = TransactionFactory.htlcClaim({
                lockTransactionId: lockTransaction.id,
                unlockSecret: "wrong 32 bytes unlock secret =((",
            })
                .withPassphrase(claimPassphrase)
                .createOne();
            handler = Handlers.Registry.get(transaction.type);
            instance = Transactions.TransactionFactory.fromData(transaction);

            expect(() => handler.throwIfCannotBeApplied(instance, claimWallet, walletManager)).toThrow(
                HtlcSecretHashMismatchError,
            );
        });

        it("should not throw if claiming wallet is not recipient of lock transaction", () => {
            const dummyPassphrase = "not recipient of lock";
            const dummyKeys = Identities.Keys.fromPassphrase(dummyPassphrase);

            const dummyWallet = new Wallets.Wallet(Identities.Address.fromPublicKey(dummyKeys.publicKey, 23));
            dummyWallet.publicKey = dummyKeys.publicKey;

            const htlcClaimAsset = {
                lockTransactionId: lockTransaction.id,
                unlockSecret: "my secret that should be 32bytes",
            };

            transaction = TransactionFactory.htlcClaim(htlcClaimAsset)
                .withPassphrase(dummyPassphrase)
                .createOne();

            handler = Handlers.Registry.get(transaction.type);
            instance = Transactions.TransactionFactory.fromData(transaction);

            expect(() => handler.throwIfCannotBeApplied(instance, dummyWallet, walletManager)).not.toThrow();
        });

        it("should throw if lock expired", () => {
            const amount = 1e9;
            const secret = "my secret that should be 32bytes";
            const secretHash = Crypto.HashAlgorithms.sha256(secret).toString("hex");
            const htlcLockAsset = {
                secretHash,
                expiration: {
                    type: expirationType,
                    value: makeExpiredTimestamp(expirationType),
                },
            };
            lockTransaction = TransactionFactory.htlcLock(htlcLockAsset, claimWallet.address, amount)
                .withPassphrase(lockPassphrase)
                .createOne();

            const htlcClaimAsset = {
                lockTransactionId: lockTransaction.id,
                unlockSecret: secret,
            };

            lockWallet.setAttribute("htlc.locks", { [lockTransaction.id]: lockTransaction });
            lockWallet.setAttribute("htlc.lockedBalance", Utils.BigNumber.make(amount));
            walletManager.reindex(lockWallet);

            transaction = TransactionFactory.htlcClaim(htlcClaimAsset)
                .withPassphrase(claimPassphrase)
                .createOne();

            handler = Handlers.Registry.get(transaction.type);
            instance = Transactions.TransactionFactory.fromData(transaction);

            expect(() => handler.throwIfCannotBeApplied(instance, claimWallet, walletManager)).toThrow(
                HtlcLockExpiredError,
            );
        });
    });

    describe("canEnterTransactionPool", () => {
        const processor: Partial<TransactionPool.IProcessor> = { pushError: jest.fn() };

        it("should not throw", () => {
            expect(
                handler.canEnterTransactionPool(
                    transaction,
                    pool as TransactionPool.IConnection,
                    processor as TransactionPool.IProcessor,
                ),
            ).toBeTrue();
        });

        it("should throw if no wallet has a lock with associated transaction id", () => {
            walletManager.forgetByIndex(State.WalletIndexes.Locks, lockTransaction.id);

            expect(
                handler.canEnterTransactionPool(
                    transaction,
                    pool as TransactionPool.IConnection,
                    processor as TransactionPool.IProcessor,
                ),
            ).toBeFalse();
            expect(processor.pushError).toHaveBeenCalled();
        });
    });

    describe("apply", () => {
        it("should apply htlc claim transaction", () => {
            expect(() => handler.throwIfCannotBeApplied(instance, claimWallet, walletManager)).not.toThrow();

            const balanceBefore = claimWallet.balance;

            expect(lockWallet.getAttribute("htlc.locks", {})[lockTransaction.id]).toBeDefined();
            expect(lockWallet.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO)).toEqual(lockTransaction.amount);

            handler.apply(instance, walletManager);

            expect(lockWallet.getAttribute("htlc.locks", {})[transaction.id]).toBeUndefined();
            expect(lockWallet.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO)).toEqual(Utils.BigNumber.ZERO);
            expect(claimWallet.balance).toEqual(balanceBefore.plus(lockTransaction.amount).minus(transaction.fee));
        });

        it("should apply htlc claim transaction - when sender is not claim wallet", () => {
            const dummyPassphrase = "dummy passphrase";
            const dummyKeys = Identities.Keys.fromPassphrase(dummyPassphrase);
            const dummyWallet = new Wallets.Wallet(Identities.Address.fromPublicKey(dummyKeys.publicKey, 23));
            dummyWallet.publicKey = dummyKeys.publicKey;

            transaction = TransactionFactory.htlcClaim(htlcClaimAsset)
                .withPassphrase(dummyPassphrase)
                .createOne();

            instance = Transactions.TransactionFactory.fromData(transaction);

            expect(() => handler.throwIfCannotBeApplied(instance, dummyWallet, walletManager)).not.toThrow();

            const balanceBefore = claimWallet.balance;

            expect(lockWallet.getAttribute("htlc.locks", {})[lockTransaction.id]).toBeDefined();
            expect(lockWallet.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO)).toEqual(lockTransaction.amount);

            handler.apply(instance, walletManager);

            expect(lockWallet.getAttribute("htlc.locks", {})[transaction.id]).toBeUndefined();
            expect(lockWallet.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO)).toEqual(Utils.BigNumber.ZERO);
            expect(claimWallet.balance).toEqual(balanceBefore.plus(lockTransaction.amount).minus(transaction.fee));
        });
    });

    describe("revert", () => {
        it("should be ok", async () => {
            expect(() => handler.throwIfCannotBeApplied(instance, claimWallet, walletManager)).not.toThrow();

            mockTransaction = lockTransaction;
            const balanceBefore = claimWallet.balance;

            handler.apply(instance, walletManager);

            expect(lockWallet.getAttribute("htlc.locks", {})[transaction.id]).toBeUndefined();
            expect(lockWallet.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO)).toEqual(Utils.BigNumber.ZERO);
            expect(claimWallet.balance).toEqual(balanceBefore.plus(lockTransaction.amount).minus(transaction.fee));

            await handler.revert(instance, walletManager);

            lockWallet = walletManager.findByIndex(State.WalletIndexes.Locks, lockTransaction.id);
            expect(lockWallet).toBeDefined();
            expect(lockWallet.getAttribute("htlc.locks", {})[lockTransaction.id]).toEqual(lockTransaction);
            expect(lockWallet.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO)).toEqual(lockTransaction.amount);
            expect(claimWallet.balance).toEqual(balanceBefore);
        });
    });
});

describe.each([UnixTimestamp, BlockHeight])("Htlc refund - expiration type %i", expirationType => {
    const lockPassphrase = "craft imitate step mixture patch forest volcano business charge around girl confirm";
    const lockKeys = Identities.Keys.fromPassphrase(lockPassphrase);

    let lockWallet;
    let lockTransaction: Interfaces.ITransactionData;
    let htlcRefundAsset;

    let pool: Partial<TransactionPool.IConnection>;

    beforeAll(() => {
        Managers.configManager.setFromPreset("testnet");
    });

    beforeEach(() => {
        walletManager = new Wallets.WalletManager();

        pool = { walletManager };

        lockWallet = new Wallets.Wallet(Identities.Address.fromPublicKey(lockKeys.publicKey, 23));
        lockWallet.publicKey = lockKeys.publicKey;
        lockWallet.balance = Utils.BigNumber.make(4527654310);

        walletManager.reindex(lockWallet);

        const amount = 6 * 1e8;
        const secret = "my secret that should be 32bytes";
        const secretHash = Crypto.HashAlgorithms.sha256(secret).toString("hex");
        const htlcLockAsset = {
            secretHash,
            expiration: {
                type: expirationType,
                value: makeExpiredTimestamp(expirationType),
            },
        };
        lockTransaction = TransactionFactory.htlcLock(htlcLockAsset, recipientWallet.address, amount)
            .withPassphrase(lockPassphrase)
            .createOne();

        htlcRefundAsset = {
            lockTransactionId: lockTransaction.id,
        };

        lockWallet.setAttribute("htlc.locks", { [lockTransaction.id]: lockTransaction });
        lockWallet.setAttribute("htlc.lockedBalance", Utils.BigNumber.make(amount));
        walletManager.reindex(lockWallet);

        transaction = TransactionFactory.htlcRefund(htlcRefundAsset)
            .withPassphrase(lockPassphrase)
            .createOne();

        handler = Handlers.Registry.get(transaction.type);
        instance = Transactions.TransactionFactory.fromData(transaction);
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", () => {
            expect(() => handler.throwIfCannotBeApplied(instance, lockWallet, walletManager)).not.toThrow();
        });

        it("should throw if no wallet has a lock with associated transaction id", () => {
            walletManager.forgetByIndex(State.WalletIndexes.Locks, lockTransaction.id);

            expect(() => handler.throwIfCannotBeApplied(instance, lockWallet, walletManager)).toThrow(
                HtlcLockTransactionNotFoundError,
            );
        });

        it("should not throw if refund wallet is not sender of lock transaction", () => {
            const dummyPassphrase = "not lock passphrase";
            const dummyKeys = Identities.Keys.fromPassphrase(dummyPassphrase);

            const dummyWallet = new Wallets.Wallet(Identities.Address.fromPublicKey(dummyKeys.publicKey, 23));
            dummyWallet.publicKey = dummyKeys.publicKey;

            const htlcRefundAsset = {
                lockTransactionId: lockTransaction.id,
            };
            transaction = TransactionFactory.htlcRefund(htlcRefundAsset)
                .withPassphrase(dummyPassphrase)
                .createOne();

            handler = Handlers.Registry.get(transaction.type);
            instance = Transactions.TransactionFactory.fromData(transaction);

            expect(() => handler.throwIfCannotBeApplied(instance, dummyWallet, walletManager)).not.toThrow();
        });

        it("should throw if lock didn't expire - expiration type %i", () => {
            const amount = 6 * 1e8;
            const secret = "my secret that should be 32bytes";
            const secretHash = Crypto.HashAlgorithms.sha256(secret).toString("hex");
            const htlcLockAsset = {
                secretHash,
                expiration: {
                    type: expirationType,
                    value: makeNotExpiredTimestamp(expirationType),
                },
            };
            lockTransaction = TransactionFactory.htlcLock(htlcLockAsset, lockWallet.address, amount)
                .withPassphrase(lockPassphrase)
                .createOne();

            const htlcRefundAsset = {
                lockTransactionId: lockTransaction.id,
            };

            lockWallet.setAttribute("htlc.locks", { [lockTransaction.id]: lockTransaction });
            lockWallet.setAttribute("htlc.lockedBalance", Utils.BigNumber.make(amount));
            walletManager.reindex(lockWallet);

            transaction = TransactionFactory.htlcRefund(htlcRefundAsset)
                .withPassphrase(lockPassphrase)
                .createOne();

            handler = Handlers.Registry.get(transaction.type);
            instance = Transactions.TransactionFactory.fromData(transaction);

            expect(() => handler.throwIfCannotBeApplied(instance, lockWallet, walletManager)).toThrow(
                HtlcLockNotExpiredError,
            );
        });
    });

    describe("canEnterTransactionPool", () => {
        const processor: Partial<TransactionPool.IProcessor> = { pushError: jest.fn() };

        it("should not throw", () => {
            expect(
                handler.canEnterTransactionPool(
                    transaction,
                    pool as TransactionPool.IConnection,
                    processor as TransactionPool.IProcessor,
                ),
            ).toBeTrue();
        });

        it("should throw if no wallet has a lock with associated transaction id", () => {
            walletManager.forgetByIndex(State.WalletIndexes.Locks, lockTransaction.id);

            expect(
                handler.canEnterTransactionPool(
                    transaction,
                    pool as TransactionPool.IConnection,
                    processor as TransactionPool.IProcessor,
                ),
            ).toBeFalse();
            expect(processor.pushError).toHaveBeenCalled();
        });
    });

    describe("apply", () => {
        it("should apply htlc refund transaction", () => {
            expect(() => handler.throwIfCannotBeApplied(instance, lockWallet, walletManager)).not.toThrow();

            const balanceBefore = lockWallet.balance;

            expect(lockWallet.getAttribute("htlc.locks", {})[lockTransaction.id]).toBeDefined();
            expect(lockWallet.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO)).toEqual(lockTransaction.amount);

            handler.apply(instance, walletManager);

            expect(lockWallet.getAttribute("htlc.locks", {})[transaction.id]).toBeUndefined();
            expect(lockWallet.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO)).toEqual(Utils.BigNumber.ZERO);
            expect(lockWallet.balance).toEqual(balanceBefore.plus(lockTransaction.amount).minus(transaction.fee));
        });

        it("should apply htlc refund transaction - when sender is not refund wallet", () => {
            const dummyPassphrase = "dummy passphrase";
            const dummyKeys = Identities.Keys.fromPassphrase(dummyPassphrase);
            const dummyWallet = new Wallets.Wallet(Identities.Address.fromPublicKey(dummyKeys.publicKey, 23));
            dummyWallet.publicKey = dummyKeys.publicKey;

            transaction = TransactionFactory.htlcRefund(htlcRefundAsset)
                .withPassphrase(dummyPassphrase)
                .createOne();

            instance = Transactions.TransactionFactory.fromData(transaction);

            expect(() => handler.throwIfCannotBeApplied(instance, dummyWallet, walletManager)).not.toThrow();

            const balanceBefore = lockWallet.balance;

            expect(lockWallet.getAttribute("htlc.locks", {})[lockTransaction.id]).toBeDefined();
            expect(lockWallet.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO)).toEqual(lockTransaction.amount);

            handler.apply(instance, walletManager);

            expect(lockWallet.getAttribute("htlc.locks", {})[transaction.id]).toBeUndefined();
            expect(lockWallet.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO)).toEqual(Utils.BigNumber.ZERO);
            expect(lockWallet.balance).toEqual(balanceBefore.plus(lockTransaction.amount).minus(transaction.fee));
        });
    });

    describe("revert", () => {
        it("should be ok", async () => {
            expect(() => handler.throwIfCannotBeApplied(instance, lockWallet, walletManager)).not.toThrow();

            mockTransaction = lockTransaction;
            console.log(mockTransaction.id);
            const balanceBefore = lockWallet.balance;

            handler.apply(instance, walletManager);

            expect(lockWallet.getAttribute("htlc.locks", {})[transaction.id]).toBeUndefined();
            expect(lockWallet.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO)).toEqual(Utils.BigNumber.ZERO);
            expect(lockWallet.balance).toEqual(balanceBefore.plus(lockTransaction.amount).minus(transaction.fee));

            await handler.revert(instance, walletManager);

            lockWallet = walletManager.findByIndex(State.WalletIndexes.Locks, lockTransaction.id);
            expect(lockWallet).toBeDefined();
            expect(lockWallet.getAttribute("htlc.locks", {})[lockTransaction.id]).toEqual(lockTransaction);
            expect(lockWallet.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO)).toEqual(lockTransaction.amount);
            expect(lockWallet.balance).toEqual(balanceBefore);
        });
    });
});
