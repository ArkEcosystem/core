import "jest-extended";

import { State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Wallets } from "@arkecosystem/core-state";
import { Crypto, Enums, Errors, Identities, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import {
    AlreadyVotedError,
    HtlcLockExpiredError,
    HtlcLockNotExpiredError,
    HtlcLockTransactionNotFoundError,
    HtlcSecretHashMismatchError,
    InsufficientBalanceError,
    InvalidMultiSignatureError,
    InvalidSecondSignatureError,
    IpfsHashAlreadyExists,
    LegacyMultiSignatureError,
    MultiSignatureAlreadyRegisteredError,
    MultiSignatureKeyCountMismatchError,
    MultiSignatureMinimumKeysError,
    NotEnoughDelegatesError,
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
import { TransactionFactory } from "../../helpers/transaction-factory";
import { htlcSecretHex, htlcSecretHashHex } from "../../utils/fixtures";

const { EpochTimestamp, BlockHeight } = Enums.HtlcLockExpirationType;

const mockLastBlockData: Partial<Interfaces.IBlockData> = { timestamp: Crypto.Slots.getTime(), height: 4 };

const makeBlockHeightTimestamp = (heightRelativeToLastBlock = 2) =>
    mockLastBlockData.height + heightRelativeToLastBlock;
const makeExpiredTimestamp = type =>
    type === EpochTimestamp ? mockLastBlockData.timestamp - 9 : makeBlockHeightTimestamp(-2);
const makeNotExpiredTimestamp = type =>
    type === EpochTimestamp ? mockLastBlockData.timestamp + 99 : makeBlockHeightTimestamp(9);

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
                            walletManager,
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
    beforeEach(async () => {
        handler = await Handlers.Registry.get(transaction.type);
        instance = Transactions.TransactionFactory.fromData(transaction);
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toResolve();
        });

        it("should be false if wallet publicKey does not match tx senderPublicKey", async () => {
            instance.data.senderPublicKey = "a".repeat(66);
            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).rejects.toThrowError(
                SenderWalletMismatchError,
            );
        });

        it("should be false if the transaction has a second signature but wallet does not", async () => {
            instance = Transactions.TransactionFactory.fromData(transactionWithSecondSignature);
            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).rejects.toThrowError(
                UnexpectedSecondSignatureError,
            );
        });

        it("should be false if the wallet has a second public key but the transaction second signature does not match", async () => {
            senderWallet.setAttribute("secondPublicKey", "invalid-public-key");
            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).rejects.toThrow(
                InvalidSecondSignatureError,
            );
        });

        it("should be false if wallet has not enough balance", async () => {
            // 1 arktoshi short
            senderWallet.balance = transaction.amount.plus(transaction.fee).minus(1);
            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).rejects.toThrow(
                InsufficientBalanceError,
            );
        });

        it("should be true even with publicKey case mismatch", async () => {
            transaction.senderPublicKey = transaction.senderPublicKey.toUpperCase();
            senderWallet.publicKey = senderWallet.publicKey.toLowerCase();
            instance = Transactions.TransactionFactory.fromData(transaction);
            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toResolve();
        });

        it("should throw if legacy multisig wallet", async () => {
            senderWallet.setAttribute("multiSignature", {
                keysgroup: [
                    "+039180ea4a8a803ee11ecb462bb8f9613fcdb5fe917e292dbcc73409f0e98f8f22",
                    "+028d3611c4f32feca3e6713992ae9387e18a0e01954046511878fe078703324dc0",
                    "+021d3932ab673230486d0f956d05b9e88791ee298d9af2d6df7d9ed5bb861c92dd",
                ],
                min: 3,
                lifetime: 0,
                legacy: true,
            });

            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).rejects.toThrowError(
                LegacyMultiSignatureError,
            );
        });
    });

    describe("apply", () => {
        it("should be ok", async () => {
            const senderBalance = senderWallet.balance;
            const recipientBalance = recipientWallet.balance;

            await handler.apply(instance, walletManager);

            expect(senderWallet.balance).toEqual(
                Utils.BigNumber.make(senderBalance)
                    .minus(instance.data.amount)
                    .minus(instance.data.fee),
            );

            expect(recipientWallet.balance).toEqual(Utils.BigNumber.make(recipientBalance).plus(instance.data.amount));
        });

        it("should not fail due to case mismatch", async () => {
            transaction.senderPublicKey = transaction.senderPublicKey.toUpperCase();
            const instance = Transactions.TransactionFactory.fromData(transaction);

            const senderBalance = senderWallet.balance;
            const recipientBalance = recipientWallet.balance;

            await handler.apply(instance, walletManager);

            expect(senderWallet.balance).toEqual(
                Utils.BigNumber.make(senderBalance)
                    .minus(instance.data.amount)
                    .minus(instance.data.fee),
            );

            expect(recipientWallet.balance).toEqual(Utils.BigNumber.make(recipientBalance).plus(instance.data.amount));
        });

        it("should increase nonce when applying v1 transactions", async () => {
            senderWallet.nonce = Utils.BigNumber.ZERO;
            const legacyTransaction = TransactionFactory.transfer("AbfQq8iRSf9TFQRzQWo33dHYU7HFMS17Zd", 10000000)
                .withVersion(1)
                .withFee(10000000)
                .withPassphrase("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire")
                .build()[0];

            expect(senderWallet.nonce).toEqual(Utils.BigNumber.ZERO);
            await handler.apply(legacyTransaction, walletManager);
            expect(senderWallet.nonce).toEqual(Utils.BigNumber.ONE);
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

        it("should decrease nonce when reverting v1 transactions", async () => {
            senderWallet.nonce = Utils.BigNumber.ONE;
            const legacyTransaction = TransactionFactory.transfer("AbfQq8iRSf9TFQRzQWo33dHYU7HFMS17Zd", 10000000)
                .withVersion(1)
                .withFee(10000000)
                .withPassphrase("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire")
                .build()[0];

            expect(senderWallet.nonce).toEqual(Utils.BigNumber.ONE);
            await handler.revert(legacyTransaction, walletManager);
            expect(senderWallet.nonce).toEqual(Utils.BigNumber.ZERO);
        });
    });

    describe("dynamicFees", () => {
        Managers.configManager.getMilestone().aip11 = true;

        const transaction = TransactionFactory.transfer("AFzQCx5YpGg5vKMBg4xbuYbqkhvMkKfKe5")
            .withNonce(Utils.BigNumber.make(0))
            .withPassphrase("secret")
            .build()[0];

        it("should correctly calculate the transaction fee based on transaction size and addonBytes", async () => {
            const addonBytes = 137;
            const handler = await Handlers.Registry.get(transaction.type);

            expect(handler.dynamicFee({ transaction, addonBytes, satoshiPerByte: 3, height: 1 })).toEqual(
                Utils.BigNumber.make(137 + transaction.serialized.length / 2).times(3),
            );

            expect(handler.dynamicFee({ transaction, addonBytes, satoshiPerByte: 6, height: 1 })).toEqual(
                Utils.BigNumber.make(137 + transaction.serialized.length / 2).times(6),
            );

            expect(handler.dynamicFee({ transaction, addonBytes: 0, satoshiPerByte: 9, height: 1 })).toEqual(
                Utils.BigNumber.make(transaction.serialized.length / 2).times(9),
            );
        });

        it("should default satoshiPerByte to 1 if value provided is <= 0", async () => {
            const handler = await Handlers.Registry.get(transaction.type);

            expect(handler.dynamicFee({ transaction, addonBytes: 0, satoshiPerByte: -50, height: 1 })).toEqual(
                handler.dynamicFee({ transaction, addonBytes: 0, satoshiPerByte: 1, height: 1 }),
            );
            expect(handler.dynamicFee({ transaction, addonBytes: 0, satoshiPerByte: 0, height: 1 })).toEqual(
                handler.dynamicFee({ transaction, addonBytes: 0, satoshiPerByte: 1, height: 1 }),
            );
        });
    });
});

describe("TransferTransaction", () => {
    beforeEach(async () => {
        handler = await Handlers.Registry.get(transaction.type);
        instance = Transactions.TransactionFactory.fromData(transaction);
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toResolve();
        });

        it("should throw", async () => {
            instance.data.senderPublicKey = "a".repeat(66);
            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).rejects.toThrow(
                SenderWalletMismatchError,
            );
        });
    });
});

describe("SecondSignatureRegistrationTransaction", () => {
    beforeEach(async () => {
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

        handler = await Handlers.Registry.get(transaction.type);
        instance = Transactions.TransactionFactory.fromData(transaction);
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toResolve();
        });

        it("should throw if wallet already has a second signature", async () => {
            senderWallet.setAttribute(
                "secondPublicKey",
                "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
            );

            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).rejects.toThrow(
                SecondSignatureAlreadyRegisteredError,
            );
        });

        it("should throw if wallet has insufficient funds", async () => {
            senderWallet.balance = Utils.BigNumber.ZERO;

            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).rejects.toThrow(
                InsufficientBalanceError,
            );
        });
    });

    describe("apply", () => {
        it("should not throw with second signature registration", async () => {
            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toResolve();

            await handler.apply(instance, walletManager);
            expect(senderWallet.getAttribute("secondPublicKey")).toBe(
                "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
            );
        });

        it("should be invalid to apply a second signature registration twice", async () => {
            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toResolve();

            await handler.apply(instance, walletManager);
            expect(senderWallet.getAttribute("secondPublicKey")).toBe(
                "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
            );

            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).rejects.toThrow(
                SecondSignatureAlreadyRegisteredError,
            );
        });
    });

    describe("revert", () => {
        it("should be ok", async () => {
            expect(senderWallet.getAttribute("secondPublicKey")).toBeUndefined();
            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toResolve();

            await handler.apply(instance, walletManager);
            expect(senderWallet.getAttribute("secondPublicKey")).toBe(
                "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
            );

            await handler.revert(instance, walletManager);
            expect(senderWallet.getAttribute("secondPublicKey")).toBeUndefined();
        });
    });
});

describe("DelegateRegistrationTransaction", () => {
    beforeEach(async () => {
        transaction = TransactionFactory.delegateRegistration("dummy")
            .withFee(10000000)
            .withPassphrase("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire")
            .createOne();

        handler = await Handlers.Registry.get(transaction.type);
        instance = Transactions.TransactionFactory.fromData(transaction);
    });

    describe("canApply", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toResolve();
        });

        it("should throw if wallet already registered a username", async () => {
            senderWallet.setAttribute("delegate", { username: "dummy" });

            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).rejects.toThrow(
                WalletIsAlreadyDelegateError,
            );
        });

        it("should throw if wallet has insufficient funds", async () => {
            walletManager.forgetByUsername("dummy");
            senderWallet.forgetAttribute("delegate");
            senderWallet.balance = Utils.BigNumber.ZERO;

            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).rejects.toThrow(
                InsufficientBalanceError,
            );
        });
    });

    describe("apply", () => {
        it("should set username", async () => {
            await handler.apply(instance, walletManager);
            expect(senderWallet.getAttribute("delegate.username")).toBe("dummy");
        });
    });

    describe("revert", () => {
        it("should unset username", async () => {
            senderWallet.nonce = Utils.BigNumber.make(1);

            await handler.revert(instance, walletManager);

            expect(senderWallet.nonce.isZero()).toBeTrue();
            expect(senderWallet.getAttribute("delegate.username")).toBeUndefined();
        });
    });
});

describe("VoteTransaction", () => {
    let voteTransaction: Interfaces.ITransactionData;
    let unvoteTransaction: Interfaces.ITransactionData;
    let delegateWallet: State.IWallet;

    beforeEach(async () => {
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

        handler = await Handlers.Registry.get(voteTransaction.type);
        instance = Transactions.TransactionFactory.fromData(voteTransaction);
    });

    describe("canApply", () => {
        it("should not throw if the vote is valid and the wallet has not voted", async () => {
            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toResolve();
        });

        it("should not throw if the unvote is valid and the wallet has voted", async () => {
            senderWallet.setAttribute("vote", "038082dad560a22ea003022015e3136b21ef1ffd9f2fd50049026cbe8e2258ca17");
            instance = Transactions.TransactionFactory.fromData(unvoteTransaction);
            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toResolve();
        });

        it("should throw if wallet has already voted", async () => {
            senderWallet.setAttribute("vote", "038082dad560a22ea003022015e3136b21ef1ffd9f2fd50049026cbe8e2258ca17");
            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).rejects.toThrow(
                AlreadyVotedError,
            );
        });

        it("should throw if the asset public key differs from the currently voted one", async () => {
            senderWallet.setAttribute("vote", "a310ad026647eed112d1a46145eed58b8c19c67c505a67f1199361a511ce7860c0");
            instance = Transactions.TransactionFactory.fromData(unvoteTransaction);
            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).rejects.toThrow(
                UnvoteMismatchError,
            );
        });

        it("should throw if unvoting a non-voted wallet", async () => {
            instance = Transactions.TransactionFactory.fromData(unvoteTransaction);
            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).rejects.toThrow(
                NoVoteError,
            );
        });

        it("should throw if wallet has insufficient funds", async () => {
            senderWallet.balance = Utils.BigNumber.ZERO;
            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).rejects.toThrow(
                InsufficientBalanceError,
            );
        });
    });

    describe("apply", () => {
        describe("vote", () => {
            it("should be ok", async () => {
                expect(senderWallet.getAttribute("vote")).toBeUndefined();

                await handler.apply(instance, walletManager);
                expect(senderWallet.getAttribute("vote")).not.toBeUndefined();
            });

            it("should not be ok", async () => {
                senderWallet.setAttribute("vote", "038082dad560a22ea003022015e3136b21ef1ffd9f2fd50049026cbe8e2258ca17");

                expect(senderWallet.getAttribute("vote")).not.toBeUndefined();

                await expect(handler.apply(instance, walletManager)).rejects.toThrow(AlreadyVotedError);

                expect(senderWallet.getAttribute("vote")).not.toBeUndefined();
            });
        });

        describe("unvote", () => {
            it("should remove the vote from the wallet", async () => {
                senderWallet.setAttribute("vote", "038082dad560a22ea003022015e3136b21ef1ffd9f2fd50049026cbe8e2258ca17");

                expect(senderWallet.getAttribute("vote")).not.toBeUndefined();

                instance = Transactions.TransactionFactory.fromData(unvoteTransaction);
                await handler.apply(instance, walletManager);

                expect(senderWallet.getAttribute("vote")).toBeUndefined();
            });
        });
    });

    describe("revert", () => {
        describe("vote", () => {
            it("should remove the vote from the wallet", async () => {
                senderWallet.setAttribute("vote", "038082dad560a22ea003022015e3136b21ef1ffd9f2fd50049026cbe8e2258ca17");
                senderWallet.nonce = Utils.BigNumber.make(1);

                expect(senderWallet.getAttribute("vote")).not.toBeUndefined();

                await handler.revert(instance, walletManager);

                expect(senderWallet.nonce.isZero()).toBeTrue();
                expect(senderWallet.getAttribute("vote")).toBeUndefined();
            });
        });

        describe("unvote", () => {
            it("should add the vote to the wallet", async () => {
                senderWallet.nonce = Utils.BigNumber.make(1);

                expect(senderWallet.getAttribute("vote")).toBeUndefined();

                instance = Transactions.TransactionFactory.fromData(unvoteTransaction);
                await handler.revert(instance, walletManager);

                expect(senderWallet.nonce.isZero()).toBeTrue();
                expect(senderWallet.getAttribute("vote")).toBe(
                    "038082dad560a22ea003022015e3136b21ef1ffd9f2fd50049026cbe8e2258ca17",
                );
            });
        });
    });
});

describe("MultiSignatureRegistrationTransaction", () => {
    beforeEach(async () => {
        transaction = TransactionFactory.multiSignature().create()[0];

        handler = await Handlers.Registry.get(transaction.type);
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
        it("should not throw", async () => {
            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toResolve();
        });

        it("should throw if the wallet already has multisignatures", async () => {
            recipientWallet.setAttribute("multiSignature", instance.data.asset.multiSignature);
            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).rejects.toThrow(
                MultiSignatureAlreadyRegisteredError,
            );
        });

        it("should throw if failure to verify signatures", async () => {
            senderWallet.verifySignatures = jest.fn(() => false);
            senderWallet.forgetAttribute("multiSignature");

            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).rejects.toThrow(
                InvalidMultiSignatureError,
            );
        });

        it("should throw if failure to verify signatures in asset", async () => {
            instance.data.signatures[0] = instance.data.signatures[0].replace("00", "02");
            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).rejects.toThrow(
                InvalidMultiSignatureError,
            );
        });

        it("should throw if the number of keys is less than minimum", async () => {
            senderWallet.forgetAttribute("multiSignature");

            senderWallet.verifySignatures = jest.fn(() => true);
            Transactions.Verifier.verifySecondSignature = jest.fn(() => true);

            instance.data.asset.multiSignature.publicKeys.splice(0, 5);
            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).rejects.toThrow(
                MultiSignatureMinimumKeysError,
            );
        });

        it("should throw if the number of keys does not equal the signature count", async () => {
            senderWallet.forgetAttribute("multiSignature");

            senderWallet.verifySignatures = jest.fn(() => true);
            Transactions.Verifier.verifySecondSignature = jest.fn(() => true);

            instance.data.signatures.splice(0, 2);
            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).rejects.toThrow(
                MultiSignatureKeyCountMismatchError,
            );
        });

        it("should throw if the same participant provides multiple signatures", async () => {
            const passphrases = ["secret1", "secret2", "secret3"];
            const participants = [
                Identities.PublicKey.fromPassphrase(passphrases[0]),
                Identities.PublicKey.fromPassphrase(passphrases[1]),
                Identities.PublicKey.fromPassphrase(passphrases[2]),
            ];

            const participantWallet = walletManager.findByPublicKey(participants[0]);
            participantWallet.balance = Utils.BigNumber.make(1e8 * 100);

            const multSigRegistration = TransactionFactory.multiSignature(participants)
                .withPassphrase(passphrases[0])
                .withPassphraseList(passphrases)
                .build()[0];

            const multiSigWallet = walletManager.findByPublicKey(
                Identities.PublicKey.fromMultiSignatureAsset(multSigRegistration.data.asset.multiSignature),
            );

            await expect(
                handler.throwIfCannotBeApplied(multSigRegistration, participantWallet, walletManager),
            ).toResolve();

            expect(multiSigWallet.hasMultiSignature()).toBeFalse();

            await handler.apply(multSigRegistration, walletManager);

            expect(multiSigWallet.hasMultiSignature()).toBeTrue();

            multiSigWallet.balance = Utils.BigNumber.make(1e8 * 100);

            const transferBuilder = Transactions.BuilderFactory.transfer()
                .recipientId(multiSigWallet.address)
                .nonce("1")
                .amount("100")
                .senderPublicKey(multiSigWallet.publicKey);

            // Different valid signatures of same payload and private key
            const signatures = [
                "774b430573285f09bd8e61bf04582b06ef55ee0e454cd0f86b396c47ea1269f514748e8fb2315f2f0ce4bb81777ae673d8cab44a54a773f3c20cb0c754fd67ed",
                "dfb75f880769c3ae27640e1214a7ece017ddd684980e2276c908fe7806c1d6e8ceac47bb53004d84bdac22cdcb482445c056256a6cd417c5dc973d8266164ec0",
                "64233bb62b694eb0004e1d5d497b0b0e6d977b3a0e2403a9abf59502aef65c36c6e0eed599d314d4f55a03fc0dc48f0c9c9fd4bfab65e5ac8fe2a5c5ac3ed2ae",
            ];

            // All verify with participants[0]
            transferBuilder.data.signatures = [];
            for (const signature of signatures) {
                transferBuilder.data.signatures.push(`${Utils.numberToHex(0)}${signature}`);
            }

            expect(() => transferBuilder.build()).toThrow(Errors.DuplicateParticipantInMultiSignatureError);
            expect(() => multiSigWallet.verifySignatures(transferBuilder.getStruct())).toThrow(
                Errors.DuplicateParticipantInMultiSignatureError,
            );
        });

        it("should throw if wallet has insufficient funds", async () => {
            senderWallet.forgetAttribute("multiSignature");
            senderWallet.balance = Utils.BigNumber.ZERO;

            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).rejects.toThrow(
                InsufficientBalanceError,
            );
        });
    });

    describe("apply", () => {
        it("should be ok", async () => {
            recipientWallet.forgetAttribute("multiSignature");

            expect(senderWallet.hasAttribute("multiSignature")).toBeFalse();
            expect(recipientWallet.hasAttribute("multiSignature")).toBeFalse();

            expect(senderWallet.balance).toEqual(Utils.BigNumber.make(100390000000));
            expect(recipientWallet.balance).toEqual(Utils.BigNumber.ZERO);

            await handler.apply(instance, walletManager);

            expect(senderWallet.balance).toEqual(Utils.BigNumber.make(98390000000));
            expect(recipientWallet.balance).toEqual(Utils.BigNumber.ZERO);

            expect(senderWallet.hasAttribute("multiSignature")).toBeFalse();
            expect(recipientWallet.getAttribute("multiSignature")).toEqual(transaction.asset.multiSignature);
        });
    });

    describe("revert", () => {
        it("should be ok", async () => {
            senderWallet.nonce = Utils.BigNumber.make(1);

            await handler.revert(instance, walletManager);

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

    beforeEach(async () => {
        transaction = TransactionFactory.ipfs("QmR45FmbVVrixReBwJkhEKde2qwHYaQzGxu4ZoDeswuF9w").createOne();

        handler = await Handlers.Registry.get(transaction.type);
        instance = Transactions.TransactionFactory.fromData(transaction);
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toResolve();
        });

        it("should throw if wallet has insufficient funds", async () => {
            senderWallet.balance = Utils.BigNumber.ZERO;

            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).rejects.toThrow(
                InsufficientBalanceError,
            );
        });

        it("should throw if hash already exists", async () => {
            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toResolve();
            await expect(handler.apply(instance, walletManager)).toResolve();
            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).rejects.toThrow(
                IpfsHashAlreadyExists,
            );
        });
    });

    describe("apply", () => {
        it("should apply ipfs transaction", async () => {
            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toResolve();

            const balanceBefore = senderWallet.balance;

            await handler.apply(instance, walletManager);

            expect(
                senderWallet.getAttribute<State.IWalletIpfsAttributes>("ipfs.hashes")[transaction.asset.ipfs],
            ).toBeTrue();
            expect(senderWallet.balance).toEqual(balanceBefore.minus(transaction.fee));
        });
    });

    describe("revert", () => {
        it("should be ok", async () => {
            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toResolve();

            const balanceBefore = senderWallet.balance;

            await handler.apply(instance, walletManager);

            expect(senderWallet.balance).toEqual(balanceBefore.minus(transaction.fee));
            expect(
                senderWallet.getAttribute<State.IWalletIpfsAttributes>("ipfs.hashes")[transaction.asset.ipfs],
            ).toBeTrue();

            await handler.revert(instance, walletManager);

            expect(senderWallet.getAttribute("ipfs")).toBeFalsy();
            expect(senderWallet.balance).toEqual(balanceBefore);
        });
    });
});

describe("MultiPaymentTransaction", () => {
    beforeEach(async () => {
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
        handler = await Handlers.Registry.get(transaction.type);

        instance = Transactions.TransactionFactory.fromData(transaction);
    });

    describe("canApply", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toResolve();
        });

        it("should throw if wallet has insufficient funds", async () => {
            senderWallet.balance = Utils.BigNumber.ZERO;
            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).rejects.toThrow(
                InsufficientBalanceError,
            );
        });

        it("should throw if wallet has insufficient funds send all payouts", async () => {
            senderWallet.balance = Utils.BigNumber.make(150); // short by the fee
            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).rejects.toThrow(
                InsufficientBalanceError,
            );
        });
    });

    describe("apply", () => {
        it("should be ok", async () => {
            const senderBalance = senderWallet.balance;
            const totalPaymentsAmount = instance.data.asset.payments.reduce(
                (prev, curr) => prev.plus(curr.amount),
                Utils.BigNumber.ZERO,
            );

            await handler.apply(instance, walletManager);

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

            await handler.revert(instance, walletManager);
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
    let allByUsername;

    beforeEach(async () => {
        transaction = TransactionFactory.delegateResignation()
            .withPassphrase("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire")
            .createOne();

        voteTransaction = TransactionFactory.vote("03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37")
            .withPassphrase("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire")
            .createOne();

        senderWallet.setAttribute("delegate", { username: "tiredDelegate" });
        senderWallet.forgetAttribute("delegate.resigned");

        walletManager.reindex(senderWallet);
        allByUsername = jest.spyOn(walletManager, "allByUsername").mockReturnValue(new Array(52).fill(recipientWallet));

        handler = await Handlers.Registry.get(transaction.type);
        instance = Transactions.TransactionFactory.fromData(transaction);
    });

    afterEach(() => {
        allByUsername.mockRestore();
    });

    describe("canApply", () => {
        it("should not throw if wallet is a delegate", async () => {
            senderWallet.setAttribute("delegate", {});
            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toResolve();
        });

        it("should throw if wallet is not a delegate", async () => {
            senderWallet.forgetAttribute("delegate");
            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).rejects.toThrow(
                WalletNotADelegateError,
            );
        });

        it("should throw if wallet has insufficient funds", async () => {
            senderWallet.balance = Utils.BigNumber.ZERO;
            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).rejects.toThrow(
                InsufficientBalanceError,
            );
        });

        it("should throw if not enough delegates", async () => {
            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toResolve();
            senderWallet.forgetAttribute("delegate.resigned");
            allByUsername = jest
                .spyOn(walletManager, "allByUsername")
                .mockReturnValueOnce(new Array(51).fill(senderWallet));
            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).rejects.toThrow(
                NotEnoughDelegatesError,
            );
        });

        it("should throw if not enough delegates due to already resigned delegates", async () => {
            allByUsername = jest
                .spyOn(walletManager, "allByUsername")
                .mockReturnValueOnce([...new Array(51).fill(senderWallet), recipientWallet]);

            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toResolve();

            recipientWallet.setAttribute("delegate.resigned", true);

            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).rejects.toThrow(
                NotEnoughDelegatesError,
            );
        });
    });

    describe("apply", () => {
        it("should apply delegate resignation", async () => {
            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toResolve();

            await handler.apply(instance, walletManager);
            expect(senderWallet.getAttribute<boolean>("delegate.resigned")).toBeTrue();
        });

        it("should fail when already resigned", async () => {
            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toResolve();

            await handler.apply(instance, walletManager);
            expect(senderWallet.getAttribute<boolean>("delegate.resigned")).toBeTrue();

            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).rejects.toThrow(
                WalletAlreadyResignedError,
            );
        });

        it("should fail when not a delegate", async () => {
            senderWallet.forgetAttribute("delegate");

            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).rejects.toThrow(
                WalletNotADelegateError,
            );
        });

        it("should fail when voting for a resigned delegate", async () => {
            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toResolve();

            await handler.apply(instance, walletManager);
            expect(senderWallet.getAttribute<boolean>("delegate.resigned")).toBeTrue();

            const vote = Transactions.TransactionFactory.fromData(voteTransaction);
            const voteHandler = await Handlers.Registry.get(vote.type);

            await expect(voteHandler.throwIfCannotBeApplied(vote, senderWallet, walletManager)).rejects.toThrow(
                VotedForResignedDelegateError,
            );
        });
    });

    describe("revert", () => {
        it("should be ok", async () => {
            expect(senderWallet.hasAttribute("delegate.resigned")).toBeFalse();
            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toResolve();

            await handler.apply(instance, walletManager);
            expect(senderWallet.getAttribute<boolean>("delegate.resigned")).toBeTrue();
            await handler.revert(instance, walletManager);
            expect(senderWallet.getAttribute<boolean>("delegate.resigned")).toBeFalsy();
        });
    });
});

describe.each([EpochTimestamp, BlockHeight])("Htlc lock - expiration type %i", expirationType => {
    const htlcLockAsset = {
        secretHash: htlcSecretHashHex,
        expiration: {
            type: expirationType,
            value: makeNotExpiredTimestamp(expirationType),
        },
    };

    beforeAll(() => {
        Managers.configManager.setFromPreset("testnet");
    });

    beforeEach(async () => {
        transaction = TransactionFactory.htlcLock(htlcLockAsset)
            .withPassphrase("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire")
            .createOne();

        handler = await Handlers.Registry.get(transaction.type);
        instance = Transactions.TransactionFactory.fromData(transaction);
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toResolve();
        });

        it("should throw if wallet has insufficient funds", async () => {
            senderWallet.balance = Utils.BigNumber.ZERO;

            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).rejects.toThrow(
                InsufficientBalanceError,
            );
        });

        it("should throw if lock is already expired", async () => {
            delete process.env.CORE_ENV;

            if (expirationType === Enums.HtlcLockExpirationType.BlockHeight) {
                instance.data.asset.lock.expiration.value = 4;
            } else {
                instance.data.asset.lock.expiration.value = Crypto.Slots.getTime();
            }

            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).rejects.toThrow(
                HtlcLockExpiredError,
            );

            if (expirationType === Enums.HtlcLockExpirationType.BlockHeight) {
                instance.data.asset.lock.expiration.value = 1000;
            } else {
                instance.data.asset.lock.expiration.value = Crypto.Slots.getTime() + 10000;
            }

            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toResolve();

            process.env.CORE_ENV = "test";
        });
    });

    describe("apply", () => {
        it("should apply htlc lock transaction", async () => {
            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toResolve();

            const balanceBefore = senderWallet.balance;

            await handler.apply(instance, walletManager);

            expect(senderWallet.getAttribute("htlc.locks")[transaction.id]).toBeDefined();
            expect(senderWallet.getAttribute("htlc.lockedBalance")).toEqual(transaction.amount);
            expect(senderWallet.balance).toEqual(balanceBefore.minus(transaction.fee).minus(transaction.amount));
        });
    });

    describe("revert", () => {
        it("should be ok", async () => {
            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletManager)).toResolve();

            const balanceBefore = senderWallet.balance;

            await handler.apply(instance, walletManager);

            expect(senderWallet.getAttribute("htlc.locks", {})[transaction.id]).toBeDefined();
            expect(senderWallet.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO)).toEqual(transaction.amount);
            expect(senderWallet.balance).toEqual(balanceBefore.minus(transaction.fee).minus(transaction.amount));

            await handler.revert(instance, walletManager);

            expect(senderWallet.getAttribute("htlc.locks", {})[transaction.id]).toBeUndefined();
            expect(senderWallet.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO)).toEqual(Utils.BigNumber.ZERO);
            expect(senderWallet.balance).toEqual(balanceBefore);
        });
    });
});

describe.each([EpochTimestamp, BlockHeight])("Htlc claim - expiration type %i", expirationType => {
    const lockPassphrase = "craft imitate step mixture patch forest volcano business charge around girl confirm";
    const lockKeys = Identities.Keys.fromPassphrase(lockPassphrase);
    const claimPassphrase = "fatal hat sail asset chase barrel pluck bag approve coral slab bright";
    const claimKeys = Identities.Keys.fromPassphrase(claimPassphrase);

    let lockWallet: State.IWallet;
    let claimWallet: State.IWallet;

    let htlcClaimAsset;

    let lockTransaction: Interfaces.ITransactionData;

    let pool: Partial<TransactionPool.IConnection>;

    beforeAll(() => {
        Managers.configManager.setFromPreset("testnet");
    });

    beforeEach(async () => {
        walletManager = new Wallets.WalletManager();
        pool = {
            walletManager,
            getTransactionsByType: async (): Promise<Set<Interfaces.ITransaction>> => new Set(),
        };

        lockWallet = new Wallets.Wallet(Identities.Address.fromPublicKey(lockKeys.publicKey, 23));
        lockWallet.publicKey = lockKeys.publicKey;
        lockWallet.balance = Utils.BigNumber.make(4527654310);

        claimWallet = new Wallets.Wallet(Identities.Address.fromPublicKey(claimKeys.publicKey, 23));
        claimWallet.publicKey = claimKeys.publicKey;

        walletManager.reindex(lockWallet);
        walletManager.reindex(claimWallet);

        const amount = 6 * 1e8;
        const htlcLockAsset = {
            secretHash: htlcSecretHashHex,
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
            unlockSecret: htlcSecretHex,
        };

        lockWallet.setAttribute("htlc.locks", {
            [lockTransaction.id]: {
                amount: lockTransaction.amount,
                recipientId: lockTransaction.recipientId,
                ...lockTransaction.asset.lock,
            },
        });

        lockWallet.setAttribute("htlc.lockedBalance", Utils.BigNumber.make(amount));
        walletManager.reindex(lockWallet);

        transaction = TransactionFactory.htlcClaim(htlcClaimAsset)
            .withPassphrase(claimPassphrase)
            .createOne();

        handler = await Handlers.Registry.get(transaction.type);
        instance = Transactions.TransactionFactory.fromData(transaction);
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotBeApplied(instance, claimWallet, walletManager)).toResolve();
        });

        it("should throw if no wallet has a lock with associated transaction id", async () => {
            walletManager.forgetByIndex(State.WalletIndexes.Locks, lockTransaction.id);

            await expect(handler.throwIfCannotBeApplied(instance, claimWallet, walletManager)).rejects.toThrow(
                HtlcLockTransactionNotFoundError,
            );
        });

        it("should throw if secret hash does not match", async () => {
            transaction = TransactionFactory.htlcClaim({
                lockTransactionId: lockTransaction.id,
                unlockSecret: "0000000000000000000000000000000000000000000000000000000000000000",
            })
                .withPassphrase(claimPassphrase)
                .createOne();
            handler = await Handlers.Registry.get(transaction.type);
            instance = Transactions.TransactionFactory.fromData(transaction);

            await expect(handler.throwIfCannotBeApplied(instance, claimWallet, walletManager)).rejects.toThrow(
                HtlcSecretHashMismatchError,
            );
        });

        it("should not throw if claiming wallet is not recipient of lock transaction", async () => {
            const dummyPassphrase = "not recipient of lock";
            const dummyKeys = Identities.Keys.fromPassphrase(dummyPassphrase);

            const dummyWallet = new Wallets.Wallet(Identities.Address.fromPublicKey(dummyKeys.publicKey, 23));
            dummyWallet.publicKey = dummyKeys.publicKey;

            walletManager.reindex(dummyWallet);

            const htlcClaimAsset = {
                lockTransactionId: lockTransaction.id,
                unlockSecret: htlcSecretHex,
            };

            transaction = TransactionFactory.htlcClaim(htlcClaimAsset)
                .withPassphrase(dummyPassphrase)
                .createOne();

            handler = await Handlers.Registry.get(transaction.type);
            instance = Transactions.TransactionFactory.fromData(transaction);

            await expect(handler.throwIfCannotBeApplied(instance, dummyWallet, walletManager)).toResolve();
        });

        it("should throw if lock expired", async () => {
            const amount = 1e9;
            const htlcLockAsset = {
                secretHash: htlcSecretHashHex,
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
                unlockSecret: htlcSecretHex,
            };

            lockWallet.setAttribute("htlc.locks", {
                [lockTransaction.id]: {
                    amount: lockTransaction.amount,
                    recipientId: lockTransaction.recipientId,
                    ...lockTransaction.asset.lock,
                },
            });

            lockWallet.setAttribute("htlc.lockedBalance", Utils.BigNumber.make(amount));
            walletManager.reindex(lockWallet);

            transaction = TransactionFactory.htlcClaim(htlcClaimAsset)
                .withPassphrase(claimPassphrase)
                .createOne();

            handler = await Handlers.Registry.get(transaction.type);
            instance = Transactions.TransactionFactory.fromData(transaction);

            await expect(handler.throwIfCannotBeApplied(instance, claimWallet, walletManager)).rejects.toThrow(
                HtlcLockExpiredError,
            );
        });
    });

    describe("canEnterTransactionPool", () => {
        const processor: Partial<TransactionPool.IProcessor> = { pushError: jest.fn() };

        it("should not throw", async () => {
            await expect(
                handler.canEnterTransactionPool(
                    transaction,
                    pool as TransactionPool.IConnection,
                    processor as TransactionPool.IProcessor,
                ),
            ).resolves.toBeNull();
        });

        it("should throw if no wallet has a lock with associated transaction id", async () => {
            walletManager.forgetByIndex(State.WalletIndexes.Locks, lockTransaction.id);

            await expect(
                handler.canEnterTransactionPool(
                    transaction,
                    pool as TransactionPool.IConnection,
                    processor as TransactionPool.IProcessor,
                ),
            ).resolves.not.toBeNull();
        });
    });

    describe("apply", () => {
        it("should apply htlc claim transaction", async () => {
            await expect(handler.throwIfCannotBeApplied(instance, claimWallet, walletManager)).toResolve();

            const balanceBefore = claimWallet.balance;

            expect(lockWallet.getAttribute("htlc.locks")).toBeDefined();
            expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(lockTransaction.amount);

            await handler.apply(instance, walletManager);

            expect(lockWallet.getAttribute("htlc.locks")).toBeEmpty();
            expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(Utils.BigNumber.ZERO);
            expect(claimWallet.balance).toEqual(balanceBefore.plus(lockTransaction.amount).minus(transaction.fee));
        });

        it("should apply htlc claim transaction - when sender is not claim wallet", async () => {
            const dummyPassphrase = "dummy passphrase";
            const dummyKeys = Identities.Keys.fromPassphrase(dummyPassphrase);
            const dummyWallet = new Wallets.Wallet(Identities.Address.fromPublicKey(dummyKeys.publicKey, 23));
            dummyWallet.publicKey = dummyKeys.publicKey;

            walletManager.reindex(dummyWallet);

            transaction = TransactionFactory.htlcClaim(htlcClaimAsset)
                .withPassphrase(dummyPassphrase)
                .createOne();

            instance = Transactions.TransactionFactory.fromData(transaction);

            await expect(handler.throwIfCannotBeApplied(instance, dummyWallet, walletManager)).toResolve();

            const balanceBefore = claimWallet.balance;

            expect(lockWallet.getAttribute("htlc.locks")).not.toBeEmpty();
            expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(lockTransaction.amount);

            await handler.apply(instance, walletManager);

            expect(lockWallet.getAttribute("htlc.locks")).toBeEmpty();
            expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(Utils.BigNumber.ZERO);
            expect(claimWallet.balance).toEqual(balanceBefore.plus(lockTransaction.amount).minus(transaction.fee));
        });
    });

    describe("revert", () => {
        it("should be ok", async () => {
            await expect(handler.throwIfCannotBeApplied(instance, claimWallet, walletManager)).toResolve();

            mockTransaction = lockTransaction;
            const balanceBefore = claimWallet.balance;

            await handler.apply(instance, walletManager);

            expect(lockWallet.getAttribute("htlc.locks")).toBeEmpty();
            expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(Utils.BigNumber.ZERO);
            expect(claimWallet.balance).toEqual(balanceBefore.plus(lockTransaction.amount).minus(transaction.fee));

            await handler.revert(instance, walletManager);

            lockWallet = walletManager.findByIndex(State.WalletIndexes.Locks, lockTransaction.id);
            expect(lockWallet).toBeDefined();
            expect(lockWallet.getAttribute("htlc.locks")[lockTransaction.id]).toEqual({
                amount: lockTransaction.amount,
                recipientId: lockTransaction.recipientId,
                ...lockTransaction.asset.lock,
            });

            expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(lockTransaction.amount);
            expect(claimWallet.balance).toEqual(balanceBefore);
        });
    });
});

describe.each([EpochTimestamp, BlockHeight])("Htlc refund - expiration type %i", expirationType => {
    const lockPassphrase = "craft imitate step mixture patch forest volcano business charge around girl confirm";
    const lockKeys = Identities.Keys.fromPassphrase(lockPassphrase);

    let lockWallet;
    let lockTransaction: Interfaces.ITransactionData;
    let htlcRefundAsset;

    let pool: Partial<TransactionPool.IConnection>;

    beforeAll(() => {
        Managers.configManager.setFromPreset("testnet");
    });

    beforeEach(async () => {
        walletManager = new Wallets.WalletManager();

        pool = {
            walletManager,
            getTransactionsByType: async (): Promise<Set<Interfaces.ITransaction>> => new Set(),
        };

        lockWallet = new Wallets.Wallet(Identities.Address.fromPublicKey(lockKeys.publicKey, 23));
        lockWallet.publicKey = lockKeys.publicKey;
        lockWallet.balance = Utils.BigNumber.make(4527654310);

        walletManager.reindex(lockWallet);

        const amount = 6 * 1e8;
        const htlcLockAsset = {
            secretHash: htlcSecretHashHex,
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

        lockWallet.setAttribute("htlc.locks", {
            [lockTransaction.id]: {
                amount: lockTransaction.amount,
                recipientId: lockTransaction.recipientId,
                ...lockTransaction.asset.lock,
            },
        });

        lockWallet.setAttribute("htlc.lockedBalance", Utils.BigNumber.make(amount));
        walletManager.reindex(lockWallet);

        transaction = TransactionFactory.htlcRefund(htlcRefundAsset)
            .withPassphrase(lockPassphrase)
            .createOne();

        handler = await Handlers.Registry.get(transaction.type);
        instance = Transactions.TransactionFactory.fromData(transaction);
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotBeApplied(instance, lockWallet, walletManager)).toResolve();
        });

        it("should throw if no wallet has a lock with associated transaction id", async () => {
            walletManager.forgetByIndex(State.WalletIndexes.Locks, lockTransaction.id);

            await expect(handler.throwIfCannotBeApplied(instance, lockWallet, walletManager)).rejects.toThrow(
                HtlcLockTransactionNotFoundError,
            );
        });

        it("should not throw if refund wallet is not sender of lock transaction", async () => {
            const dummyPassphrase = "not lock passphrase";
            const dummyKeys = Identities.Keys.fromPassphrase(dummyPassphrase);

            const dummyWallet = new Wallets.Wallet(Identities.Address.fromPublicKey(dummyKeys.publicKey, 23));
            dummyWallet.publicKey = dummyKeys.publicKey;

            walletManager.reindex(dummyWallet);

            const htlcRefundAsset = {
                lockTransactionId: lockTransaction.id,
            };
            transaction = TransactionFactory.htlcRefund(htlcRefundAsset)
                .withPassphrase(dummyPassphrase)
                .createOne();

            handler = await Handlers.Registry.get(transaction.type);
            instance = Transactions.TransactionFactory.fromData(transaction);

            await expect(handler.throwIfCannotBeApplied(instance, dummyWallet, walletManager)).toResolve();
        });

        it("should throw if lock didn't expire - expiration type %i", async () => {
            const amount = 6 * 1e8;
            const htlcLockAsset = {
                secretHash: htlcSecretHashHex,
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

            lockWallet.setAttribute("htlc.locks", {
                [lockTransaction.id]: {
                    amount: lockTransaction.amount,
                    recipientId: lockTransaction.recipientId,
                    ...lockTransaction.asset.lock,
                },
            });

            lockWallet.setAttribute("htlc.lockedBalance", Utils.BigNumber.make(amount));
            walletManager.reindex(lockWallet);

            transaction = TransactionFactory.htlcRefund(htlcRefundAsset)
                .withPassphrase(lockPassphrase)
                .createOne();

            handler = await Handlers.Registry.get(transaction.type);
            instance = Transactions.TransactionFactory.fromData(transaction);

            await expect(handler.throwIfCannotBeApplied(instance, lockWallet, walletManager)).rejects.toThrow(
                HtlcLockNotExpiredError,
            );
        });
    });

    describe("canEnterTransactionPool", () => {
        const processor: Partial<TransactionPool.IProcessor> = { pushError: jest.fn() };

        it("should not throw", async () => {
            await expect(
                handler.canEnterTransactionPool(
                    transaction,
                    pool as TransactionPool.IConnection,
                    processor as TransactionPool.IProcessor,
                ),
            ).resolves.toBeNull();
        });

        it("should throw if no wallet has a lock with associated transaction id", async () => {
            walletManager.forgetByIndex(State.WalletIndexes.Locks, lockTransaction.id);

            await expect(
                handler.canEnterTransactionPool(
                    transaction,
                    pool as TransactionPool.IConnection,
                    processor as TransactionPool.IProcessor,
                ),
            ).resolves.not.toBeNull();
        });
    });

    describe("apply", () => {
        it("should apply htlc refund transaction", async () => {
            await expect(handler.throwIfCannotBeApplied(instance, lockWallet, walletManager)).toResolve();

            const balanceBefore = lockWallet.balance;

            expect(lockWallet.getAttribute("htlc.locks")[lockTransaction.id]).toBeDefined();
            expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(lockTransaction.amount);

            await handler.apply(instance, walletManager);

            expect(lockWallet.getAttribute("htlc.locks")).toBeEmpty();
            expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(Utils.BigNumber.ZERO);
            expect(lockWallet.balance).toEqual(balanceBefore.plus(lockTransaction.amount).minus(transaction.fee));
        });

        it("should apply htlc refund transaction - when sender is not refund wallet", async () => {
            const dummyPassphrase = "dummy passphrase";
            const dummyKeys = Identities.Keys.fromPassphrase(dummyPassphrase);
            const dummyWallet = new Wallets.Wallet(Identities.Address.fromPublicKey(dummyKeys.publicKey, 23));
            dummyWallet.publicKey = dummyKeys.publicKey;

            walletManager.reindex(dummyWallet);

            transaction = TransactionFactory.htlcRefund(htlcRefundAsset)
                .withPassphrase(dummyPassphrase)
                .createOne();

            instance = Transactions.TransactionFactory.fromData(transaction);

            await expect(handler.throwIfCannotBeApplied(instance, dummyWallet, walletManager)).toResolve();

            const balanceBefore = lockWallet.balance;

            expect(lockWallet.getAttribute("htlc.locks")[lockTransaction.id]).toBeDefined();
            expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(lockTransaction.amount);

            await handler.apply(instance, walletManager);

            expect(lockWallet.getAttribute("htlc.locks")).toBeEmpty();
            expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(Utils.BigNumber.ZERO);
            expect(lockWallet.balance).toEqual(balanceBefore.plus(lockTransaction.amount).minus(transaction.fee));
        });
    });

    describe("revert", () => {
        it("should be ok", async () => {
            await expect(handler.throwIfCannotBeApplied(instance, lockWallet, walletManager)).toResolve();

            mockTransaction = lockTransaction;
            const balanceBefore = lockWallet.balance;

            await handler.apply(instance, walletManager);

            expect(lockWallet.getAttribute("htlc.locks")[transaction.id]).toBeUndefined();
            expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(Utils.BigNumber.ZERO);
            expect(lockWallet.balance).toEqual(balanceBefore.plus(lockTransaction.amount).minus(transaction.fee));

            await handler.revert(instance, walletManager);

            lockWallet = walletManager.findByIndex(State.WalletIndexes.Locks, lockTransaction.id);
            expect(lockWallet).toBeDefined();
            expect(lockWallet.getAttribute("htlc.locks")[lockTransaction.id]).toEqual({
                amount: lockTransaction.amount,
                recipientId: lockTransaction.recipientId,
                ...lockTransaction.asset.lock,
            });

            expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(lockTransaction.amount);
            expect(lockWallet.balance).toEqual(balanceBefore);
        });
    });
});
