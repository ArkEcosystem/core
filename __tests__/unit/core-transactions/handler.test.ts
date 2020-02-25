import "jest-extended";

import passphrases from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { BuilderFactory } from "@arkecosystem/crypto/src/transactions";
import { Contracts, Services, Application, Container, Providers } from "@arkecosystem/core-kernel";
import { Crypto, Enums, Errors, Identities, Interfaces, Managers, Transactions, Utils, } from "@arkecosystem/crypto";
import { DelegateEvent } from "@arkecosystem/core-kernel/src/enums";
import { FactoryBuilder, Factories } from "@arkecosystem/core-test-framework/src/factories";
import { Generators } from "@arkecosystem/core-test-framework/src";
import { IMultiSignatureAsset } from "@arkecosystem/crypto/src/interfaces";
import { Identifiers } from "@arkecosystem/core-kernel/src/ioc";
import { Memory } from "@arkecosystem/core-transaction-pool";
import { NullEventDispatcher } from "@arkecosystem/core-kernel/src/services/events/drivers/null";
import { One, Two } from "@arkecosystem/core-transactions/src/handlers";
import { Query } from "@arkecosystem/core-transaction-pool/src/query";
import { StateStore } from "@arkecosystem/core-state/src/stores/state";
import { TransactionHandler } from "@arkecosystem/core-transactions/src/handlers";
import { TransactionHandlerProvider } from "@arkecosystem/core-transactions/src/handlers/handler-provider";
import { TransactionHandlerRegistry } from "@arkecosystem/core-transactions/src/handlers/handler-registry";
import { TransferBuilder } from "@arkecosystem/crypto/src/transactions/builders/transactions/transfer";
import { Wallets } from "@arkecosystem/core-state";
import { addressesIndexer, publicKeysIndexer, usernamesIndexer, ipfsIndexer, locksIndexer } from "@arkecosystem/core-state/src/wallets/wallet-indexes";
import { configManager } from "@packages/crypto/src/managers";
import { getWalletAttributeSet } from "@arkecosystem/core-test-framework/src/internal/wallet-attributes";
import {
    AlreadyVotedError,
    ColdWalletError,
    HtlcLockExpiredError,
    HtlcLockNotExpiredError,
    HtlcLockTransactionNotFoundError,
    HtlcSecretHashMismatchError,
    InsufficientBalanceError,
    InvalidMultiSignatureError,
    InvalidSecondSignatureError,
    IpfsHashAlreadyExists,
    MultiSignatureAlreadyRegisteredError,
    MultiSignatureKeyCountMismatchError,
    MultiSignatureMinimumKeysError,
    NoVoteError,
    NotEnoughDelegatesError,
    NotSupportedForMultiSignatureWalletError,
    SecondSignatureAlreadyRegisteredError,
    SenderWalletMismatchError,
    UnexpectedSecondSignatureError,
    UnvoteMismatchError,
    VotedForResignedDelegateError,
    WalletAlreadyResignedError,
    WalletIsAlreadyDelegateError,
    WalletNotADelegateError,
    WalletUsernameAlreadyRegisteredError,
} from "@arkecosystem/core-transactions/src/errors";

let app: Application;
let senderWallet: Wallets.Wallet;
let secondSignatureWallet: Wallets.Wallet;
let recipientWallet: Wallets.Wallet;
let walletRepository: Contracts.State.WalletRepository;
let factoryBuilder: FactoryBuilder;

const htlcSecretHex = "my secret that should be 32bytes";
const htlcSecretHashHex = "317fcab2563aa3a1549fab4a83f9ec073f07db8ea081f7eded87b6f322fe9a09";

const { EpochTimestamp, BlockHeight } = Enums.HtlcLockExpirationType;

const mockLastBlockData: Partial<Interfaces.IBlockData> = { timestamp: Crypto.Slots.getTime() , height: 4 };

const makeBlockHeightTimestamp = (heightRelativeToLastBlock = 2) =>
    mockLastBlockData.height! + heightRelativeToLastBlock;
const makeExpiredTimestamp = type =>
    type === EpochTimestamp ? mockLastBlockData.timestamp! - 9 : makeBlockHeightTimestamp(-2);
const makeNotExpiredTimestamp = type =>
    type === EpochTimestamp ? mockLastBlockData.timestamp! + 999 : makeBlockHeightTimestamp(9);

const mockGetLastBlock = jest.fn();
StateStore.prototype.getLastBlock = mockGetLastBlock;
mockGetLastBlock.mockReturnValue( { data: mockLastBlockData } );

let mockTransaction;
let transactionRepository = {
    findByIds: async () => {
        return mockTransaction ? [mockTransaction.data] : [];
    },
    findByType: async () => {
        return mockTransaction ? [mockTransaction.data] : [];
    },
    findReceivedTransactions() {
        return mockTransaction ? [mockTransaction.data] : [];
    },
    getOpenHtlcLocks() {
        return mockTransaction ? [mockTransaction.data] : [];
    },
    getClaimedHtlcLockBalances() {
        return mockTransaction ? [{ amount: mockTransaction.data.amount, recipientId: mockTransaction.data.recipientId }] : [];
    },
    getRefundedHtlcLockBalances() {
        return mockTransaction ? [{ amount: mockTransaction.data.amount, senderPublicKey: mockTransaction.data.senderPublicKey }] : [];
    }
};

let blockRepository = {
    getDelegatesForgedBlocks: async () => {
        return []
    },
    getLastForgedBlocks: async () => {
        return []
    }
};

beforeEach(() => {
    const config = Generators.generateCryptoConfigRaw();
    configManager.setConfig(config);

    Managers.configManager.setFromPreset("testnet");

    app = new Application(new Container.Container());
    app.bind(Identifiers.ApplicationNamespace).toConstantValue("testnet");

    app
        .bind<Services.Attributes.AttributeSet>(Identifiers.WalletAttributes)
        .to(Services.Attributes.AttributeSet)
        .inSingletonScope();

    app
        .bind<Contracts.State.WalletIndexerIndex>(Identifiers.WalletRepositoryIndexerIndex)
        .toConstantValue({ name: Contracts.State.WalletIndexes.Addresses, indexer: addressesIndexer });

    app
        .bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex)
        .toConstantValue({ name: Contracts.State.WalletIndexes.PublicKeys, indexer: publicKeysIndexer });

    app
        .bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex)
        .toConstantValue({ name: Contracts.State.WalletIndexes.Usernames, indexer: usernamesIndexer });

    app
        .bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex)
        .toConstantValue({ name: Contracts.State.WalletIndexes.Ipfs, indexer: ipfsIndexer });

    app
        .bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex)
        .toConstantValue({ name: Contracts.State.WalletIndexes.Locks, indexer: locksIndexer });

    app
        .bind(Identifiers.WalletFactory)
        .toFactory<Contracts.State.Wallet>((context: Container.interfaces.Context) => (address: string) =>
            new Wallets.Wallet(
                address,
                new Services.Attributes.AttributeMap(
                    context.container.get<Services.Attributes.AttributeSet>(Identifiers.WalletAttributes),
                ),
            ),
        );

    app
        .bind(Container.Identifiers.PluginConfiguration)
        .to(Providers.PluginConfiguration)
        .inSingletonScope();

    app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration).set("maxTransactionAge", 500);

    app
        .bind(Container.Identifiers.StateStore)
        .to(StateStore)
        .inTransientScope();

    app
        .bind(Identifiers.BlockRepository)
        .toConstantValue(blockRepository);

    app.bind(Identifiers.TransactionPoolMemory).to(Memory).inSingletonScope();

    app.bind(Identifiers.TransactionPoolQuery).to(Query).inSingletonScope();

    app
        .bind(Identifiers.TransactionRepository)
        .toConstantValue(transactionRepository);

    app
        .bind(Identifiers.WalletRepository)
        .to(Wallets.WalletRepository)
        .inSingletonScope();

    app
        .bind(Identifiers.EventDispatcherService)
        .to(NullEventDispatcher)
        .inSingletonScope();

    app.bind(Identifiers.TransactionHandler).to(One.TransferTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(Two.TransferTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(One.SecondSignatureRegistrationTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(Two.SecondSignatureRegistrationTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(One.DelegateRegistrationTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(Two.DelegateRegistrationTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(One.VoteTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(Two.VoteTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(One.MultiSignatureRegistrationTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(Two.MultiSignatureRegistrationTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(Two.IpfsTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(Two.MultiPaymentTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(Two.DelegateResignationTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(Two.HtlcLockTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(Two.HtlcClaimTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(Two.HtlcRefundTransactionHandler);

    app.bind(Identifiers.TransactionHandlerProvider).to(TransactionHandlerProvider).inSingletonScope();
    app.bind(Identifiers.TransactionHandlerRegistry).to(TransactionHandlerRegistry).inSingletonScope();

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    factoryBuilder = new FactoryBuilder();
    Factories.registerWalletFactory(factoryBuilder);
    Factories.registerTransactionFactory(factoryBuilder);

    senderWallet = factoryBuilder
        .get("Wallet")
        .withOptions({
            passphrase: "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire",
            nonce: 0
        })
        .make();

    senderWallet.balance = Utils.BigNumber.make(4527654310);

    secondSignatureWallet = factoryBuilder
        .get("Wallet")
        .withOptions({
            passphrase: "venue below waste gather spin cruise title still boost mother flash tuna",
            nonce: 0
        })
        .make();

    secondSignatureWallet.balance = Utils.BigNumber.make(7527654310);
    secondSignatureWallet.setAttribute("secondPublicKey",  "038082dad560a22ea003022015e3136b21ef1ffd9f2fd50049026cbe8e2258ca17");


    recipientWallet = factoryBuilder
        .get("Wallet")
        .withOptions({
            passphrase: "passphrase2"
        })
        .make();

    walletRepository.reindex(senderWallet);
    walletRepository.reindex(secondSignatureWallet);
    walletRepository.reindex(recipientWallet);
});

describe("TransferTransaction", () => {
    let transferTransaction: Interfaces.ITransaction;
    let secondSignatureTransferTransaction: Interfaces.ITransaction;
    let handler: TransactionHandler;
    let pubKeyHash: number;

    beforeEach(async () => {
        pubKeyHash = Managers.configManager.get("network.pubKeyHash");
        const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);
        handler = transactionHandlerRegistry.getRegisteredHandlerByType(Transactions.InternalTransactionType.from(Enums.TransactionType.Transfer, Enums.TransactionTypeGroup.Core), 2);

        transferTransaction = BuilderFactory.transfer()
            .recipientId(recipientWallet.address)
            .amount("10000000")
            .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire")
            .nonce("1")
            .build();

        secondSignatureTransferTransaction = BuilderFactory.transfer()
            .recipientId(recipientWallet.address)
            .amount("1")
            .nonce("1")
            .sign("venue below waste gather spin cruise title still boost mother flash tuna")
            .secondSign("craft imitate step mixture patch forest volcano business charge around girl confirm")
            .build();
    });

    afterEach(async () => {
        Managers.configManager.set("network.pubKeyHash", pubKeyHash);
    });

    describe("bootstrap", () => {
        it("should resolve", async () => {
            mockTransaction = transferTransaction;
            await expect(handler.bootstrap()).toResolve();
        })
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotBeApplied(transferTransaction, senderWallet, walletRepository)).toResolve();
        });

        it("should not throw with second sign", async () => {
            await expect(handler.throwIfCannotBeApplied(secondSignatureTransferTransaction, secondSignatureWallet, walletRepository)).toResolve();
        });

        it("should throw", async () => {
            transferTransaction.data.senderPublicKey = "a".repeat(66);
            await expect(handler.throwIfCannotBeApplied(transferTransaction, senderWallet, walletRepository)).rejects.toThrow(
                SenderWalletMismatchError,
            );
        });

        it("should throw if wallet has insufficient funds for vote", async () => {
            senderWallet.balance = Utils.BigNumber.ZERO;
            await expect(handler.throwIfCannotBeApplied(transferTransaction, senderWallet, walletRepository)).rejects.toThrow(
                InsufficientBalanceError,
            );
        });

        it("should throw if sender is cold wallet", async () => {
            const coldWallet: Wallets.Wallet = factoryBuilder
                .get("Wallet")
                .withOptions({
                    passphrase: "fatal hat sail asset chase barrel pluck bag approve coral slab bright",
                    nonce: 0
                })
                .make();

            coldWallet.balance = Utils.BigNumber.ZERO;

            transferTransaction = BuilderFactory.transfer()
                .amount("10000000")
                .recipientId(recipientWallet.address)
                .nonce("1")
                .sign("fatal hat sail asset chase barrel pluck bag approve coral slab bright")
                .build();

            await expect(handler.throwIfCannotBeApplied(transferTransaction, coldWallet, walletRepository)).rejects.toThrow(
                ColdWalletError,
            );
        });

        it("should not throw if recipient is cold wallet", async () => {
            const coldWallet: Wallets.Wallet = factoryBuilder
                .get("Wallet")
                .withOptions({
                    passphrase: "fatal hat sail asset chase barrel pluck bag approve coral slab bright",
                    nonce: 0
                })
                .make();

            coldWallet.balance = Utils.BigNumber.ZERO;

            transferTransaction = BuilderFactory.transfer()
                .amount("10000000")
                .recipientId(coldWallet.address)
                .nonce("1")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire")
                .build();

            await expect(handler.throwIfCannotBeApplied(transferTransaction, senderWallet, walletRepository)).toResolve();
        });
    });

    describe("throwIfCannotEnterPool", () => {
        it("should not throw", async () => {
            await expect(
                handler.throwIfCannotEnterPool(
                    transferTransaction
                ),
            ).toResolve();
        });

        it("should throw if no wallet is not recipient on the active network", async () => {
            Managers.configManager.set("network.pubKeyHash", 99);

            await expect(handler.throwIfCannotEnterPool(transferTransaction)).rejects.toThrow(Contracts.TransactionPool.PoolError);
        });
    });

    describe("apply", () => {
        it("should be ok", async () => {
            const senderBalance = senderWallet.balance;
            const recipientBalance = recipientWallet.balance;

            await handler.apply(transferTransaction, walletRepository);

            expect(senderWallet.balance).toEqual(
                Utils.BigNumber.make(senderBalance)
                    .minus(transferTransaction.data.amount)
                    .minus(transferTransaction.data.fee),
            );

            expect(recipientWallet.balance).toEqual(Utils.BigNumber.make(recipientBalance).plus(transferTransaction.data.amount));
        });
    });

    describe("revert", () => {
        it("should be ok", async () => {
            const senderBalance = senderWallet.balance;
            const recipientBalance = recipientWallet.balance;

            await handler.apply(transferTransaction, walletRepository);

            expect(senderWallet.balance).toEqual(
                Utils.BigNumber.make(senderBalance)
                    .minus(transferTransaction.data.amount)
                    .minus(transferTransaction.data.fee),
            );

            expect(recipientWallet.balance).toEqual(Utils.BigNumber.make(recipientBalance).plus(transferTransaction.data.amount));

            await handler.revert(transferTransaction, walletRepository);

            expect(senderWallet.balance).toEqual(Utils.BigNumber.make(senderBalance));

            expect(recipientWallet.balance).toEqual(recipientBalance);
        });
    });
});

describe("General Tests", () => {
    let transferTransaction: Interfaces.ITransaction;
    let transactionWithSecondSignature: Interfaces.ITransaction;
    let handler: TransactionHandler;

    beforeEach(async () => {
        const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);
        handler = transactionHandlerRegistry.getRegisteredHandlerByType(Transactions.InternalTransactionType.from(Enums.TransactionType.Transfer, Enums.TransactionTypeGroup.Core), 2);

        transferTransaction = BuilderFactory.transfer()
            .recipientId(recipientWallet.address)
            .amount("10000000")
            .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire")
            .nonce("1")
            .build();

        transactionWithSecondSignature = BuilderFactory.transfer()
            .recipientId(recipientWallet.address)
            .amount("10000000")
            .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire")
            .secondSign("venue below waste gather spin cruise title still boost mother flash tuna")
            .nonce("1")
            .build();
    });

    describe("throwIfCannotBeApplied", () => {

        it("should not throw", async () => {
            await expect(handler.throwIfCannotBeApplied(transferTransaction, senderWallet, walletRepository)).toResolve();
        });

        it("should be false if wallet publicKey does not match tx senderPublicKey", async () => {
            transferTransaction.data.senderPublicKey = "a".repeat(66);
            await expect(handler.throwIfCannotBeApplied(transferTransaction, senderWallet, walletRepository)).rejects.toThrowError(
                SenderWalletMismatchError,
            );
        });

        it("should be false if the transaction has a second signature but wallet does not", async () => {
            await expect(handler.throwIfCannotBeApplied(transactionWithSecondSignature, senderWallet, walletRepository)).rejects.toThrowError(
                UnexpectedSecondSignatureError,
            );
        });

        it("should be false if the wallet has a second public key but the transaction second signature does not match", async () => {
            senderWallet.setAttribute("secondPublicKey", "invalid-public-key");
            await expect(handler.throwIfCannotBeApplied(transactionWithSecondSignature, senderWallet, walletRepository)).rejects.toThrow(
                InvalidSecondSignatureError,
            );
        });

        it("should be false if wallet has not enough balance", async () => {
            // 1 arktoshi short
            senderWallet.balance = transferTransaction.data.amount.plus(transferTransaction.data.fee).minus(1);
            await expect(handler.throwIfCannotBeApplied(transferTransaction, senderWallet, walletRepository)).rejects.toThrow(
                InsufficientBalanceError,
            );
        });

        // TODO: Check if it is ok, because .fromData changes letter case
        it("should be true even with publicKey case mismatch", async () => {
            transferTransaction.data.senderPublicKey = transferTransaction.data.senderPublicKey!.toUpperCase();
            senderWallet.publicKey = senderWallet.publicKey!.toLowerCase();

            const instance: Interfaces.ITransaction = Transactions.TransactionFactory.fromData(transferTransaction.data);
            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletRepository)).toResolve();
        });

        // TODO: check if it is right setting for legacy test
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

            await expect(handler.throwIfCannotBeApplied(transactionWithSecondSignature, senderWallet, walletRepository)).rejects.toThrowError(
                UnexpectedSecondSignatureError,
                // LegacyMultiSignatureError,
            );
        });

        describe("apply", () => {


            // TODO: check if ok if .fromData changes case
            it("should not fail due to case mismatch", async () => {
                let transactionData: Interfaces.ITransactionData = transferTransaction.data;
                transactionData.senderPublicKey = transactionData.senderPublicKey?.toUpperCase();
                const instance = Transactions.TransactionFactory.fromData(transactionData);

                const senderBalance = senderWallet.balance;
                const recipientBalance = recipientWallet.balance;

                await handler.apply(instance, walletRepository);

                expect(senderWallet.balance).toEqual(
                    Utils.BigNumber.make(senderBalance)
                        .minus(instance.data.amount)
                        .minus(instance.data.fee),
                );

                expect(recipientWallet.balance).toEqual(Utils.BigNumber.make(recipientBalance).plus(instance.data.amount));
            });

            // TODO: unsupported: should increase nonce when applying v1 transactions
        });

        describe("revert", () => {
            it("should be ok", async () => {
                const senderBalance = senderWallet.balance;
                const recipientBalance = recipientWallet.balance;
                senderWallet.nonce = Utils.BigNumber.make(1);

                await handler.revert(transferTransaction, walletRepository);
                expect(senderWallet.balance).toEqual(
                    Utils.BigNumber.make(senderBalance)
                        .plus(transferTransaction.data.amount)
                        .plus(transferTransaction.data.fee),
                );

                expect(senderWallet.nonce.isZero()).toBeTrue();
                expect(recipientWallet.balance).toEqual(Utils.BigNumber.make(recipientBalance).minus(transferTransaction.data.amount));
            });

            // TODO: check if ok if .fromData changes case
            it("should not fail due to case mismatch", async () => {
                senderWallet.nonce = Utils.BigNumber.make(1);

                let transactionData: Interfaces.ITransactionData = transferTransaction.data;
                transactionData.senderPublicKey = transactionData.senderPublicKey?.toUpperCase();
                const instance = Transactions.TransactionFactory.fromData(transactionData);

                const senderBalance = senderWallet.balance;
                const recipientBalance = recipientWallet.balance;

                await handler.revert(instance, walletRepository);
                expect(senderWallet.balance).toEqual(
                    Utils.BigNumber.make(senderBalance)
                        .plus(instance.data.amount)
                        .plus(instance.data.fee),
                );

                expect(senderWallet.nonce.isZero()).toBeTrue();
                expect(recipientWallet.balance).toEqual(Utils.BigNumber.make(recipientBalance).minus(instance.data.amount));
            });

            // TODO: no builder for V1: it("should decrease nonce when reverting v1 transactions")
        });
    });

    describe("dynamicFees", () => {
        beforeEach(async () => {
            const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);
            handler = transactionHandlerRegistry.getRegisteredHandlerByType(Transactions.InternalTransactionType.from(Enums.TransactionType.Transfer, Enums.TransactionTypeGroup.Core), 2);

            transferTransaction = BuilderFactory.transfer()
                .amount("10000000")
                .recipientId(recipientWallet.address)
                .sign("secret")
                .nonce("0")
                .build();

            Managers.configManager.getMilestone().aip11 = true;
        });

        it("should correctly calculate the transaction fee based on transaction size and addonBytes", async () => {
            const addonBytes = 137;

            expect(handler.dynamicFee({ transaction: transferTransaction, addonBytes, satoshiPerByte: 3, height: 1 })).toEqual(
                Utils.BigNumber.make(137 + transferTransaction.serialized.length / 2).times(3),
            );

            expect(handler.dynamicFee({ transaction: transferTransaction, addonBytes, satoshiPerByte: 6, height: 1 })).toEqual(
                Utils.BigNumber.make(137 + transferTransaction.serialized.length / 2).times(6),
            );

            expect(handler.dynamicFee({ transaction: transferTransaction, addonBytes: 0, satoshiPerByte: 9, height: 1 })).toEqual(
                Utils.BigNumber.make(transferTransaction.serialized.length / 2).times(9),
            );
        });

        it("should default satoshiPerByte to 1 if value provided is <= 0", async () => {
            expect(handler.dynamicFee({ transaction: transferTransaction, addonBytes: 0, satoshiPerByte: -50, height: 1 })).toEqual(
                handler.dynamicFee({ transaction: transferTransaction, addonBytes: 0, satoshiPerByte: 1, height: 1 }),
            );
            expect(handler.dynamicFee({ transaction: transferTransaction, addonBytes: 0, satoshiPerByte: 0, height: 1 })).toEqual(
                handler.dynamicFee({ transaction: transferTransaction, addonBytes: 0, satoshiPerByte: 1, height: 1 }),
            );
        });
    });
});

describe("SecondSignatureRegistrationTransaction", () => {
    let secondSignatureTransaction: Interfaces.ITransaction;
    let handler: TransactionHandler;

    beforeEach(async () => {
        const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);
        handler = transactionHandlerRegistry.getRegisteredHandlerByType(Transactions.InternalTransactionType.from(Enums.TransactionType.SecondSignature, Enums.TransactionTypeGroup.Core), 2);

        secondSignatureTransaction = BuilderFactory.secondSignature()
            .signatureAsset("venue below waste gather spin cruise title still boost mother flash tuna")
            .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire")
            .nonce("1")
            .build();
    });

    describe("bootstrap", () => {
        it("should resolve", async () => {
            mockTransaction = secondSignatureTransaction;
            await expect(handler.bootstrap()).toResolve();
        })
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotBeApplied(secondSignatureTransaction, senderWallet, walletRepository)).toResolve();
        });

        it("should throw if wallet already has a second signature", async () => {
            senderWallet.setAttribute(
                "secondPublicKey",
                "02def27da9336e7fbf63131b8d7e5c9f45b296235db035f1f4242c507398f0f21d",
            );

            await expect(handler.throwIfCannotBeApplied(secondSignatureTransaction, senderWallet, walletRepository)).rejects.toThrow(
                SecondSignatureAlreadyRegisteredError,
            );
        });

        it("should throw if wallet already has a multi signature", async () => {
            const multiSignatureAsset: IMultiSignatureAsset = {
                min: 2,
                publicKeys: [
                    Identities.PublicKey.fromPassphrase("peasant alert hard deposit naive follow page fiscal normal awful wedding history"),
                    Identities.PublicKey.fromPassphrase("resemble abandon same total oppose noise dune order fatal rhythm pink science"),
                    Identities.PublicKey.fromPassphrase("wide mesh ketchup acquire bright day mountain final below hamster scout drive"),
                ]
            };

            senderWallet.setAttribute(
                "multiSignature",
                multiSignatureAsset
            );

            await expect(handler.throwIfCannotBeApplied(secondSignatureTransaction, senderWallet, walletRepository)).rejects.toThrow(
                NotSupportedForMultiSignatureWalletError,
            );
        });

        it("should throw if wallet has insufficient funds", async () => {
            senderWallet.balance = Utils.BigNumber.ZERO;

            await expect(handler.throwIfCannotBeApplied(secondSignatureTransaction, senderWallet, walletRepository)).rejects.toThrow(
                InsufficientBalanceError,
            );
        });
    });

    describe("throwIfCannotEnterPool", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotEnterPool(secondSignatureTransaction)).toResolve();
        });

        it("should throw if transaction by sender already in pool", async () => {
            app.get<Memory>(Identifiers.TransactionPoolMemory).remember(secondSignatureTransaction);

            await expect(handler.throwIfCannotEnterPool(secondSignatureTransaction)).rejects.toThrow(Contracts.TransactionPool.PoolError);
        });
    });

    describe("apply", () => {
        it("should not throw with second signature registration", async () => {
            await expect(handler.throwIfCannotBeApplied(secondSignatureTransaction, senderWallet, walletRepository)).toResolve();

            await handler.apply(secondSignatureTransaction, walletRepository);
            expect(senderWallet.getAttribute("secondPublicKey")).toBe(
                "02def27da9336e7fbf63131b8d7e5c9f45b296235db035f1f4242c507398f0f21d",
            );
        });

        it("should be invalid to apply a second signature registration twice", async () => {
            await expect(handler.throwIfCannotBeApplied(secondSignatureTransaction, senderWallet, walletRepository)).toResolve();

            await handler.apply(secondSignatureTransaction, walletRepository);
            expect(senderWallet.getAttribute("secondPublicKey")).toBe(
                "02def27da9336e7fbf63131b8d7e5c9f45b296235db035f1f4242c507398f0f21d",
            );

            await expect(handler.throwIfCannotBeApplied(secondSignatureTransaction, senderWallet, walletRepository)).rejects.toThrow(
                SecondSignatureAlreadyRegisteredError,
            );
        });
    });

    describe("revert", () => {
        it("should be ok", async () => {
            expect(senderWallet.hasAttribute("secondPublicKey")).toBe(false);
            await expect(handler.throwIfCannotBeApplied(secondSignatureTransaction, senderWallet, walletRepository)).toResolve();

            await handler.apply(secondSignatureTransaction, walletRepository);
            expect(senderWallet.hasAttribute("secondPublicKey")).toBe(true);
            expect(senderWallet.getAttribute("secondPublicKey")).toBe(
                "02def27da9336e7fbf63131b8d7e5c9f45b296235db035f1f4242c507398f0f21d",
            );

            await handler.revert(secondSignatureTransaction, walletRepository);
            expect(senderWallet.hasAttribute("secondPublicKey")).toBe(false);
        });
    });
});

describe("DelegateRegistrationTransaction", () => {
    let delegateRegistrationTransaction: Interfaces.ITransaction;
    let secondSignaturedDelegateRegistrationTransaction: Interfaces.ITransaction;
    let handler: TransactionHandler;

    beforeEach(async () => {
        const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);
        handler = transactionHandlerRegistry.getRegisteredHandlerByType(Transactions.InternalTransactionType.from(Enums.TransactionType.DelegateRegistration, Enums.TransactionTypeGroup.Core), 2);

        delegateRegistrationTransaction = BuilderFactory.delegateRegistration()
            .usernameAsset("dummy")
            .nonce("1")
            .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire")
            .build();

        secondSignaturedDelegateRegistrationTransaction = BuilderFactory.delegateRegistration()
            .usernameAsset("dummy")
            .nonce("1")
            .sign("venue below waste gather spin cruise title still boost mother flash tuna")
            .secondSign("craft imitate step mixture patch forest volcano business charge around girl confirm")
            .build();
    });

    describe("bootstrap", () => {
        it("should resolve", async () => {
            mockTransaction = delegateRegistrationTransaction;
            await expect(handler.bootstrap()).toResolve();
        })
    });

    describe("emitEvents", () => {
        it("should dispatch", async () => {
            let emitter:  Contracts.Kernel.EventDispatcher = app.get<Contracts.Kernel.EventDispatcher>(Identifiers.EventDispatcherService);

            const spy = jest.spyOn(emitter, 'dispatch');

            handler.emitEvents(delegateRegistrationTransaction, emitter);

            expect(spy).toHaveBeenCalledWith(DelegateEvent.Registered, expect.anything());
        })
    });

    describe("throwIfCannotEnterPool", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotBeApplied(delegateRegistrationTransaction, senderWallet, walletRepository)).toResolve();
        });

        it("should not throw with second sign", async () => {
            await expect(handler.throwIfCannotBeApplied(secondSignaturedDelegateRegistrationTransaction, secondSignatureWallet, walletRepository)).toResolve();
        });

        it("should throw if wallet has a multi signature", async () => {
            const multiSignatureAsset: IMultiSignatureAsset = {
                min: 2,
                publicKeys: [
                    Identities.PublicKey.fromPassphrase("peasant alert hard deposit naive follow page fiscal normal awful wedding history"),
                    Identities.PublicKey.fromPassphrase("resemble abandon same total oppose noise dune order fatal rhythm pink science"),
                    Identities.PublicKey.fromPassphrase("wide mesh ketchup acquire bright day mountain final below hamster scout drive"),
                ]
            };

            senderWallet.setAttribute(
                "multiSignature",
                multiSignatureAsset
            );

            await expect(handler.throwIfCannotBeApplied(delegateRegistrationTransaction, senderWallet, walletRepository)).rejects.toThrow(
                NotSupportedForMultiSignatureWalletError,
            );
        });

        // it("should throw if transaction does not have delegate", async () => {
        //     delegateRegistrationTransaction.data.asset.delegate.username! = null;
        //
        //     await expect(handler.throwIfCannotBeApplied(delegateRegistrationTransaction, senderWallet, walletRepository)).rejects.toThrow(
        //         WalletNotADelegateError,
        //     );
        // });

        it("should throw if wallet already registered a username", async () => {
            senderWallet.setAttribute("delegate", { username: "dummy" });

            await expect(handler.throwIfCannotBeApplied(delegateRegistrationTransaction, senderWallet, walletRepository)).rejects.toThrow(
                WalletIsAlreadyDelegateError,
            );
        });

        it("should throw if another wallet already registered a username", async () => {
            const delegateWallet: Wallets.Wallet = factoryBuilder
                .get("Wallet")
                .withOptions({
                    passphrase: "delegate passphrase",
                    nonce: 0
                })
                .make();

            delegateWallet.setAttribute("delegate", { username: "dummy" });

            walletRepository.reindex(delegateWallet);

            await expect(handler.throwIfCannotBeApplied(delegateRegistrationTransaction, senderWallet, walletRepository)).rejects.toThrow(
                WalletUsernameAlreadyRegisteredError,
            );
        });

        it("should throw if wallet has insufficient funds", async () => {
            senderWallet.balance = Utils.BigNumber.ZERO;

            await expect(handler.throwIfCannotBeApplied(delegateRegistrationTransaction, senderWallet, walletRepository)).rejects.toThrow(
                InsufficientBalanceError,
            );
        });
    });

    describe("throwIfCannotEnterPool", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotEnterPool(delegateRegistrationTransaction)).toResolve();
        });

        it("should throw if transaction by sender already in pool", async () => {
            app.get<Memory>(Identifiers.TransactionPoolMemory).remember(delegateRegistrationTransaction);

            await expect(handler.throwIfCannotEnterPool(delegateRegistrationTransaction)).rejects.toThrow(Contracts.TransactionPool.PoolError);
        });

        it("should throw if transaction by sender already in pool", async () => {
            let anotherDelegateRegistrationTransaction = BuilderFactory.delegateRegistration()
                .usernameAsset("dummy")
                .nonce("1")
                .sign("craft imitate step mixture patch forest volcano business charge around girl confirm")
                .build();

            app.get<Memory>(Identifiers.TransactionPoolMemory).remember(anotherDelegateRegistrationTransaction);

            await expect(handler.throwIfCannotEnterPool(delegateRegistrationTransaction)).rejects.toThrow(Contracts.TransactionPool.PoolError);
        });
    });

    describe("apply", () => {
        it("should set username", async () => {
            await handler.apply(delegateRegistrationTransaction, walletRepository);
            expect(senderWallet.getAttribute("delegate.username")).toBe("dummy");
        });
    });

    describe("revert", () => {
        it("should unset username", async () => {
            expect(senderWallet.hasAttribute("delegate.username")).toBeFalse();

            await handler.apply(delegateRegistrationTransaction, walletRepository);

            expect(senderWallet.hasAttribute("delegate.username")).toBeTrue();
            expect(senderWallet.getAttribute("delegate.username")).toBe("dummy");

            await handler.revert(delegateRegistrationTransaction, walletRepository);

            expect(senderWallet.nonce.isZero()).toBeTrue();
            expect(senderWallet.hasAttribute("delegate.username")).toBeFalse();
        });
    });
});

describe("VoteTransaction", () => {
    let voteTransaction: Interfaces.ITransaction;
    let secondSignatureVoteTransaction: Interfaces.ITransaction;
    let unvoteTransaction: Interfaces.ITransaction;
    let secondSignatureUnvoteTransaction: Interfaces.ITransaction;
    let delegateWallet: Wallets.Wallet;
    let handler: TransactionHandler;

    beforeEach(async () => {
        const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);
        handler = transactionHandlerRegistry.getRegisteredHandlerByType(Transactions.InternalTransactionType.from(Enums.TransactionType.Vote, Enums.TransactionTypeGroup.Core), 2);

        delegateWallet = factoryBuilder
            .get("Wallet")
            .withOptions({
                passphrase: "direct palace screen shuffle world fit produce rubber jelly gather river ordinary",
                nonce: 0
            })
            .make();

        delegateWallet.setAttribute("delegate", { username: "test" });

        walletRepository.reindex(delegateWallet);

        voteTransaction = BuilderFactory.vote()
            .votesAsset(["+" + delegateWallet.publicKey!])
            .nonce("1")
            .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire")
            .build();

        secondSignatureVoteTransaction = BuilderFactory.vote()
            .votesAsset(["+" + delegateWallet.publicKey!])
            .nonce("1")
            .sign("venue below waste gather spin cruise title still boost mother flash tuna")
            .secondSign("craft imitate step mixture patch forest volcano business charge around girl confirm")
            .build();

        unvoteTransaction = BuilderFactory.vote()
            .votesAsset(["-" + delegateWallet.publicKey!])
            .nonce("1")
            .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire")
            .build();

        secondSignatureUnvoteTransaction = BuilderFactory.vote()
            .votesAsset(["-" + delegateWallet.publicKey!])
            .nonce("1")
            .sign("venue below waste gather spin cruise title still boost mother flash tuna")
            .secondSign("craft imitate step mixture patch forest volcano business charge around girl confirm")
            .build();
    });

    describe("bootstrap", () => {
        it("should resolve - vote", async () => {
            mockTransaction = voteTransaction;
            await expect(handler.bootstrap()).toResolve();

            mockTransaction = unvoteTransaction;
            await expect(handler.bootstrap()).toResolve();
        });
    });

    describe("emitEvents", () => {
        it("should dispatch", async () => {
            let emitter:  Contracts.Kernel.EventDispatcher = app.get<Contracts.Kernel.EventDispatcher>(Identifiers.EventDispatcherService);

            const spy = jest.spyOn(emitter, 'dispatch');

            handler.emitEvents(voteTransaction, emitter);

            expect(spy).toHaveBeenCalledWith("wallet.vote", expect.anything());

            handler.emitEvents(unvoteTransaction, emitter);

            expect(spy).toHaveBeenCalledWith("wallet.unvote", expect.anything());
        });
    });

    describe("throwIfCannotEnterPool", () => {
        it("should not throw if the vote is valid and the wallet has not voted", async () => {
            await expect(handler.throwIfCannotBeApplied(voteTransaction, senderWallet, walletRepository)).toResolve();
        });

        it("should not throw with second sign vote", async () => {
            await expect(handler.throwIfCannotBeApplied(secondSignatureVoteTransaction, secondSignatureWallet, walletRepository)).toResolve();
        });

        it("should not throw if the unvote is valid and the wallet has voted", async () => {
            senderWallet.setAttribute("vote", delegateWallet.publicKey);
            await expect(handler.throwIfCannotBeApplied(unvoteTransaction, senderWallet, walletRepository)).toResolve();
        });

        it("should not throw with second sign unvote", async () => {
            secondSignatureWallet.setAttribute("vote", delegateWallet.publicKey);
            await expect(handler.throwIfCannotBeApplied(secondSignatureUnvoteTransaction, secondSignatureWallet, walletRepository)).toResolve();
        });

        it("should throw if wallet has already voted", async () => {
            senderWallet.setAttribute("vote", delegateWallet.publicKey);
            await expect(handler.throwIfCannotBeApplied(voteTransaction, senderWallet, walletRepository)).rejects.toThrow(
                AlreadyVotedError,
            );
        });

        it("should throw if the asset public key differs from the currently voted one", async () => {
            senderWallet.setAttribute("vote", "a310ad026647eed112d1a46145eed58b8c19c67c505a67f1199361a511ce7860c0");
            await expect(handler.throwIfCannotBeApplied(unvoteTransaction, senderWallet, walletRepository)).rejects.toThrow(
                UnvoteMismatchError,
            );
        });

        it("should throw if unvoting a non-voted wallet", async () => {
            await expect(handler.throwIfCannotBeApplied(unvoteTransaction, senderWallet, walletRepository)).rejects.toThrow(
                NoVoteError,
            );
        });

        it("should throw if wallet has insufficient funds for vote", async () => {
            senderWallet.balance = Utils.BigNumber.ZERO;
            await expect(handler.throwIfCannotBeApplied(voteTransaction, senderWallet, walletRepository)).rejects.toThrow(
                InsufficientBalanceError,
            );
        });

        it("should not if wallet has insufficient funds for unvote", async () => {
            senderWallet.balance = Utils.BigNumber.ZERO;
            senderWallet.setAttribute("vote", delegateWallet.publicKey);
            await expect(handler.throwIfCannotBeApplied(unvoteTransaction, senderWallet, walletRepository)).rejects.toThrow(
                InsufficientBalanceError,
            );
        });
    });

    describe("apply", () => {
        describe("vote", () => {
            it("should be ok", async () => {
                expect(senderWallet.hasAttribute("vote")).toBeFalse();

                await handler.apply(voteTransaction, walletRepository);
                expect(senderWallet.getAttribute("vote")).not.toBeUndefined();
            });

            it("should not be ok", async () => {
                senderWallet.setAttribute("vote", delegateWallet.publicKey);

                expect(senderWallet.getAttribute("vote")).not.toBeUndefined();

                await expect(handler.apply(voteTransaction, walletRepository)).rejects.toThrow(AlreadyVotedError);

                expect(senderWallet.getAttribute("vote")).not.toBeUndefined();
            });
        });

        describe("unvote", () => {
            it("should remove the vote from the wallet", async () => {
                senderWallet.setAttribute("vote", delegateWallet.publicKey);

                expect(senderWallet.getAttribute("vote")).not.toBeUndefined();

                await handler.apply(unvoteTransaction, walletRepository);

                expect(senderWallet.hasAttribute("vote")).toBeFalse();
            });
        });
    });

    describe("revert", () => {
        describe("vote", () => {
            it("should remove the vote from the wallet", async () => {
                senderWallet.setAttribute("vote", delegateWallet.publicKey);
                senderWallet.nonce = Utils.BigNumber.make(1);

                expect(senderWallet.getAttribute("vote")).not.toBeUndefined();

                await handler.revert(voteTransaction, walletRepository);

                expect(senderWallet.nonce.isZero()).toBeTrue();
                expect(senderWallet.hasAttribute("vote")).toBeFalse();
            });
        });

        describe("unvote", () => {
            it("should add the vote to the wallet", async () => {
                senderWallet.nonce = Utils.BigNumber.make(1);

                expect(senderWallet.hasAttribute("vote")).toBeFalse();

                await handler.revert(unvoteTransaction, walletRepository);

                expect(senderWallet.nonce.isZero()).toBeTrue();
                expect(senderWallet.getAttribute("vote")).toBe(
                    delegateWallet.publicKey,
                );
            });
        });
    });
});

describe("DelegateResignationTransaction", () => {
    let allDelegates: [Wallets.Wallet];
    let delegateWallet: Wallets.Wallet;
    let delegatePassphrase = "my secret passphrase";

    let delegateResignationTransaction: Interfaces.ITransaction;
    let secondSignatureDelegateResignationTransaction: Interfaces.ITransaction;
    let handler: TransactionHandler;
    let voteHandler: TransactionHandler;

    beforeEach(async () => {
        const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);
        handler = transactionHandlerRegistry.getRegisteredHandlerByType(Transactions.InternalTransactionType.from(Enums.TransactionType.DelegateResignation, Enums.TransactionTypeGroup.Core), 2);
        voteHandler = transactionHandlerRegistry.getRegisteredHandlerByType(Transactions.InternalTransactionType.from(Enums.TransactionType.Vote, Enums.TransactionTypeGroup.Core), 2);

        allDelegates = Array() as [Wallets.Wallet];
        for (let i = 0; i < passphrases.length; i++) {
            let delegateWallet: Wallets.Wallet = factoryBuilder
                .get("Wallet")
                .withOptions({
                    passphrase: passphrases[i],
                    nonce: 0
                })
                .make();

            delegateWallet.setAttribute("delegate", { username: "username" +  i } );

            walletRepository.reindex(delegateWallet);
            allDelegates.push(delegateWallet);
        }

        delegateWallet = factoryBuilder
            .get("Wallet")
            .withOptions({
                passphrase: delegatePassphrase,
                nonce: 0
            })
            .make();

        delegateWallet.balance = Utils.BigNumber.make(66 * 1e8);
        delegateWallet.setAttribute("delegate", {username: "dummy"});
        walletRepository.reindex(delegateWallet);

        delegateResignationTransaction = BuilderFactory.delegateResignation()
            .nonce("1")
            .sign(delegatePassphrase)
            .build();

        secondSignatureDelegateResignationTransaction = BuilderFactory.delegateResignation()
            .nonce("1")
            .sign("venue below waste gather spin cruise title still boost mother flash tuna")
            .secondSign("craft imitate step mixture patch forest volcano business charge around girl confirm")
            .build();
    });

    describe("bootstrap", () => {
        it("should resolve", async () => {
            mockTransaction = delegateResignationTransaction;
            await expect(handler.bootstrap()).toResolve();
        })
    });

    describe("emitEvents", () => {
        it("should dispatch", async () => {
            let emitter:  Contracts.Kernel.EventDispatcher = app.get<Contracts.Kernel.EventDispatcher>(Identifiers.EventDispatcherService);

            const spy = jest.spyOn(emitter, 'dispatch');

            handler.emitEvents(delegateResignationTransaction, emitter);

            expect(spy).toHaveBeenCalledWith(DelegateEvent.Resigned, expect.anything());
        });
    });

    describe("throwIfCannotEnterPool", () => {
        it("should not throw if wallet is a delegate", async () => {
            await expect(handler.throwIfCannotBeApplied(delegateResignationTransaction, delegateWallet, walletRepository)).toResolve();
        });

        it("should not throw if wallet is a delegate - second sign", async () => {
            secondSignatureWallet.setAttribute("delegate", {username: "dummy"});
            walletRepository.reindex(secondSignatureWallet);
            await expect(handler.throwIfCannotBeApplied(secondSignatureDelegateResignationTransaction, secondSignatureWallet, walletRepository)).toResolve();
        });

        it("should not throw if wallet is a delegate due too many delegates", async () => {
            let anotherDelegate: Wallets.Wallet = factoryBuilder
                .get("Wallet")
                .withOptions({
                    passphrase: "anotherDelegate",
                    nonce: 0
                })
                .make();

            anotherDelegate.setAttribute("delegate", {username: "another"});
            walletRepository.reindex(anotherDelegate);

            await expect(handler.throwIfCannotBeApplied(delegateResignationTransaction, delegateWallet, walletRepository)).toResolve();
        });

        it("should throw if wallet is not a delegate", async () => {
            delegateWallet.forgetAttribute("delegate");
            await expect(handler.throwIfCannotBeApplied(delegateResignationTransaction, delegateWallet, walletRepository)).rejects.toThrow(
                WalletNotADelegateError,
            );
        });

        it("should throw if wallet has insufficient funds", async () => {
            delegateWallet.balance = Utils.BigNumber.ZERO;
            await expect(handler.throwIfCannotBeApplied(delegateResignationTransaction, delegateWallet, walletRepository)).rejects.toThrow(
                InsufficientBalanceError,
            );
        });

        it("should throw if not enough delegates", async () => {
            await expect(handler.throwIfCannotBeApplied(delegateResignationTransaction, delegateWallet, walletRepository)).toResolve();
            allDelegates[0].setAttribute("delegate.resigned", true);
            await expect(handler.throwIfCannotBeApplied(delegateResignationTransaction, delegateWallet, walletRepository)).rejects.toThrow(
                NotEnoughDelegatesError,
            );
        });

        it("should throw if not enough delegates due to already resigned delegates", async () => {
            await expect(handler.throwIfCannotBeApplied(delegateResignationTransaction, delegateWallet, walletRepository)).toResolve();

            delegateWallet.setAttribute("delegate.resigned", true);

            await expect(handler.throwIfCannotBeApplied(delegateResignationTransaction, delegateWallet, walletRepository)).rejects.toThrow(
                WalletAlreadyResignedError,
            );
        });

        // it("should throw if not enough delegates registered", async () => {
        //     let anotherDelegateWallet: Wallets.Wallet = factoryBuilder
        //         .get("Wallet")
        //         .withOptions({
        //             passphrase: "another delegate passphrase",
        //             nonce: 0
        //         })
        //         .make();
        //
        //     delegateWallet.setAttribute("delegate", {username: "another"});
        //
        //     await expect(handler.throwIfCannotBeApplied(delegateResignationTransaction, delegateWallet, walletRepository)).toResolve();
        // });
    });

    describe("throwIfCannotEnterPool", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotEnterPool(delegateResignationTransaction)).toResolve();
        });

        it("should throw if transaction by sender already in pool", async () => {
            app.get<Memory>(Identifiers.TransactionPoolMemory).remember(delegateResignationTransaction);

            await expect(handler.throwIfCannotEnterPool(delegateResignationTransaction)).rejects.toThrow(Contracts.TransactionPool.PoolError);
        });
    });

    describe("apply", () => {
        it("should apply delegate resignation", async () => {
            await expect(handler.throwIfCannotBeApplied(delegateResignationTransaction, delegateWallet, walletRepository)).toResolve();

            await handler.apply(delegateResignationTransaction, walletRepository);
            expect(delegateWallet.getAttribute<boolean>("delegate.resigned")).toBeTrue();
        });

        it("should fail when already resigned", async () => {
            await expect(handler.throwIfCannotBeApplied(delegateResignationTransaction, delegateWallet, walletRepository)).toResolve();

            await handler.apply(delegateResignationTransaction, walletRepository);
            expect(delegateWallet.getAttribute<boolean>("delegate.resigned")).toBeTrue();

            await expect(handler.throwIfCannotBeApplied(delegateResignationTransaction, delegateWallet, walletRepository)).rejects.toThrow(
                WalletAlreadyResignedError,
            );
        });

        it("should fail when not a delegate", async () => {
            delegateWallet.forgetAttribute("delegate");

            await expect(handler.throwIfCannotBeApplied(delegateResignationTransaction, delegateWallet, walletRepository)).rejects.toThrow(
                WalletNotADelegateError,
            );
        });

        it("should fail when voting for a resigned delegate", async () => {
            await expect(handler.throwIfCannotBeApplied(delegateResignationTransaction, delegateWallet, walletRepository)).toResolve();

            await handler.apply(delegateResignationTransaction, walletRepository);
            expect(delegateWallet.getAttribute<boolean>("delegate.resigned")).toBeTrue();

            const voteTransaction = BuilderFactory.vote()
                .votesAsset(["+" + delegateWallet.publicKey])
                .nonce("1")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire")
                .build();

            await expect(voteHandler.throwIfCannotBeApplied(voteTransaction, senderWallet, walletRepository)).rejects.toThrow(
                VotedForResignedDelegateError,
            );
        });
    });

    describe("revert", () => {
        it("should be ok", async () => {
            expect(delegateWallet.hasAttribute("delegate.resigned")).toBeFalse();
            await expect(handler.throwIfCannotBeApplied(delegateResignationTransaction, delegateWallet, walletRepository)).toResolve();

            await handler.apply(delegateResignationTransaction, walletRepository);
            expect(delegateWallet.getAttribute<boolean>("delegate.resigned")).toBeTrue();
            await handler.revert(delegateResignationTransaction, walletRepository);
            expect(delegateWallet.hasAttribute("delegate.resigned")).toBeFalse();
        });
    });
});

describe("MultiSignatureRegistrationTransaction", () => {
    let multiSignatureTransaction: Interfaces.ITransaction;
    let secondSignatureMultiSignatureTransaction: Interfaces.ITransaction;
    let recipientWallet: Wallets.Wallet;
    let handler: TransactionHandler;

    beforeEach(async () => {
        const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);
        handler = transactionHandlerRegistry.getRegisteredHandlerByType(Transactions.InternalTransactionType.from(Enums.TransactionType.MultiSignature, Enums.TransactionTypeGroup.Core), 2);

        senderWallet.balance = Utils.BigNumber.make(100390000000);

        const multiSignatureAsset: IMultiSignatureAsset = {
            publicKeys: [
                Identities.PublicKey.fromPassphrase("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire"),
                Identities.PublicKey.fromPassphrase("venue below waste gather spin cruise title still boost mother flash tuna"),
                Identities.PublicKey.fromPassphrase("craft imitate step mixture patch forest volcano business charge around girl confirm"),
            ],
            min: 2,
        };

        recipientWallet = new Wallets.Wallet(Identities.Address.fromMultiSignatureAsset(multiSignatureAsset), new Services.Attributes.AttributeMap(getWalletAttributeSet()),);

        walletRepository.reindex(recipientWallet);

        multiSignatureTransaction = BuilderFactory.multiSignature()
            .multiSignatureAsset(multiSignatureAsset)
            .senderPublicKey(Identities.PublicKey.fromPassphrase("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire"))
            .nonce("1")
            .recipientId(recipientWallet.publicKey!)
            .multiSign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire", 0)
            .multiSign("venue below waste gather spin cruise title still boost mother flash tuna", 1)
            .multiSign("craft imitate step mixture patch forest volcano business charge around girl confirm", 2)
            .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire")
            .build();

        secondSignatureMultiSignatureTransaction = BuilderFactory.multiSignature()
            .multiSignatureAsset({
                publicKeys: [
                    Identities.PublicKey.fromPassphrase("venue below waste gather spin cruise title still boost mother flash tuna"),
                    Identities.PublicKey.fromPassphrase("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire"),
                    Identities.PublicKey.fromPassphrase("craft imitate step mixture patch forest volcano business charge around girl confirm"),
                ],
                min: 2
            })
            .senderPublicKey(Identities.PublicKey.fromPassphrase("venue below waste gather spin cruise title still boost mother flash tuna"))
            .nonce("1")
            .recipientId(recipientWallet.publicKey!)
            .multiSign("venue below waste gather spin cruise title still boost mother flash tuna", 0)
            .multiSign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire", 1)
            .multiSign("craft imitate step mixture patch forest volcano business charge around girl confirm", 2)
            .sign("venue below waste gather spin cruise title still boost mother flash tuna")
            .secondSign("craft imitate step mixture patch forest volcano business charge around girl confirm")
            .build();
    });

    describe("bootstrap", () => {
        it("should resolve", async () => {
            mockTransaction = multiSignatureTransaction;
            await expect(handler.bootstrap()).toResolve();
        })
    });

    describe("throwIfCannotEnterPool", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotBeApplied(multiSignatureTransaction, senderWallet, walletRepository)).toResolve();
        });

        it("should not throw - second sign", async () => {
            await expect(handler.throwIfCannotBeApplied(secondSignatureMultiSignatureTransaction, secondSignatureWallet, walletRepository)).toResolve();
        });

        it("should throw if the wallet already has multisignatures", async () => {
            recipientWallet.setAttribute("multiSignature", multiSignatureTransaction.data.asset!.multiSignature);

            await expect(handler.throwIfCannotBeApplied(multiSignatureTransaction, senderWallet, walletRepository)).rejects.toThrow(
                MultiSignatureAlreadyRegisteredError,
            );
        });

        it("should throw if failure to verify signatures", async () => {
            handler.verifySignatures = jest.fn(() => false);
            senderWallet.forgetAttribute("multiSignature");

            await expect(handler.throwIfCannotBeApplied(multiSignatureTransaction, senderWallet, walletRepository)).rejects.toThrow(
                InvalidMultiSignatureError,
            );
        });

        // TODO: check value 02 thwors DuplicateParticipantInMultiSignatureError, 03 throws nodeError
        it("should throw if failure to verify signatures in asset", async () => {
            multiSignatureTransaction.data.signatures![0] = multiSignatureTransaction.data.signatures![0].replace("00", "02");
            await expect(handler.throwIfCannotBeApplied(multiSignatureTransaction, senderWallet, walletRepository)).rejects.toThrow(
                Error,
                // InvalidMultiSignatureError,
            );
        });

        it("should throw if the number of keys is less than minimum", async () => {
            senderWallet.forgetAttribute("multiSignature");

            handler.verifySignatures = jest.fn(() => true);
            Transactions.Verifier.verifySecondSignature = jest.fn(() => true);

            multiSignatureTransaction.data.asset!.multiSignature!.publicKeys.splice(0, 2);
            await expect(handler.throwIfCannotBeApplied(multiSignatureTransaction, senderWallet, walletRepository)).rejects.toThrow(
                MultiSignatureMinimumKeysError,
            );
        });

        it("should throw if the number of keys does not equal the signature count", async () => {
            senderWallet.forgetAttribute("multiSignature");

            handler.verifySignatures = jest.fn(() => true);
            Transactions.Verifier.verifySecondSignature = jest.fn(() => true);

            multiSignatureTransaction.data.signatures!.splice(0, 2);
            await expect(handler.throwIfCannotBeApplied(multiSignatureTransaction, senderWallet, walletRepository)).rejects.toThrow(
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

            const participantWallet = walletRepository.findByPublicKey(participants[0]);
            participantWallet.balance = Utils.BigNumber.make(1e8 * 100);

            multiSignatureTransaction = BuilderFactory.multiSignature()
                .multiSignatureAsset({
                    publicKeys: participants,
                    min: 2
                })
                .senderPublicKey(Identities.PublicKey.fromPassphrase(passphrases[0]))
                .nonce("1")
                .recipientId(recipientWallet.publicKey!)
                .multiSign(passphrases[0], 0)
                .multiSign(passphrases[1], 1)
                .multiSign(passphrases[2], 2)
                .sign(passphrases[0])
                .build();

            const multiSigWallet = walletRepository.findByPublicKey(
                Identities.PublicKey.fromMultiSignatureAsset(multiSignatureTransaction.data.asset!.multiSignature!),
            );

            await expect(
                handler.throwIfCannotBeApplied(multiSignatureTransaction, participantWallet, walletRepository),
            ).toResolve();

            expect(multiSigWallet.hasMultiSignature()).toBeFalse();

            await handler.apply(multiSignatureTransaction, walletRepository);

            expect(multiSigWallet.hasMultiSignature()).toBeTrue();

            multiSigWallet.balance = Utils.BigNumber.make(1e8 * 100);

            const transferBuilder = (<TransferBuilder>factoryBuilder
                .get("Transfer")
                .withOptions({ amount: 10000000, senderPublicKey: senderWallet.publicKey, recipientId: multiSigWallet.address })
                .make())
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire")
                .nonce("1");

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
            //
            expect(() => transferBuilder.build()).toThrow(Errors.DuplicateParticipantInMultiSignatureError);
            expect(() => handler.verifySignatures(multiSigWallet, transferBuilder.getStruct())).toThrow(
                Errors.DuplicateParticipantInMultiSignatureError,
            );
        });

        it("should throw if wallet has insufficient funds", async () => {
            senderWallet.forgetAttribute("multiSignature");
            senderWallet.balance = Utils.BigNumber.ZERO;

            await expect(handler.throwIfCannotBeApplied(multiSignatureTransaction, senderWallet, walletRepository)).rejects.toThrow(
                InsufficientBalanceError,
            );
        });
    });

    describe("throwIfCannotEnterPool", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotEnterPool(multiSignatureTransaction)).toResolve();
        });

        it("should throw if transaction by sender already in pool", async () => {
            app.get<Memory>(Identifiers.TransactionPoolMemory).remember(multiSignatureTransaction);

            await expect(handler.throwIfCannotEnterPool(multiSignatureTransaction)).rejects.toThrow(Contracts.TransactionPool.PoolError);
        });
    });

    describe("apply", () => {
        it("should be ok", async () => {
            recipientWallet.forgetAttribute("multiSignature");

            expect(senderWallet.hasAttribute("multiSignature")).toBeFalse();
            expect(recipientWallet.hasAttribute("multiSignature")).toBeFalse();

            expect(senderWallet.balance).toEqual(Utils.BigNumber.make(100390000000));
            expect(recipientWallet.balance).toEqual(Utils.BigNumber.ZERO);

            await handler.apply(multiSignatureTransaction, walletRepository);

            expect(senderWallet.balance).toEqual(Utils.BigNumber.make(98390000000));
            expect(recipientWallet.balance).toEqual(Utils.BigNumber.ZERO);

            expect(senderWallet.hasAttribute("multiSignature")).toBeFalse();
            expect(recipientWallet.getAttribute("multiSignature")).toEqual(multiSignatureTransaction.data.asset!.multiSignature);
        });
    });

    describe("revert", () => {
        it("should be ok", async () => {
            senderWallet.nonce = Utils.BigNumber.make(1);

            await handler.revert(multiSignatureTransaction, walletRepository);

            expect(senderWallet.nonce.isZero()).toBeTrue();
            expect(senderWallet.hasMultiSignature()).toBeFalse();
            expect(recipientWallet.hasMultiSignature()).toBeFalse();
        });
    });
});

describe("Ipfs", () => {
    let ipfsTransaction: Interfaces.ITransaction;
    let secondSignatureIpfsTransaction: Interfaces.ITransaction;
    let handler: TransactionHandler;

    beforeEach(async () => {
        const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);
        handler = transactionHandlerRegistry.getRegisteredHandlerByType(Transactions.InternalTransactionType.from(Enums.TransactionType.Ipfs, Enums.TransactionTypeGroup.Core), 2);

        ipfsTransaction = BuilderFactory.ipfs()
            .ipfsAsset("QmR45FmbVVrixReBwJkhEKde2qwHYaQzGxu4ZoDeswuF9w")
            .nonce("1")
            .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire")
            .build();

        secondSignatureIpfsTransaction = BuilderFactory.ipfs()
            .ipfsAsset("QmR45FmbVVrixReBwJkhEKde2qwHYaQzGxu4ZoDeswuF9w")
            .nonce("1")
            .sign("venue below waste gather spin cruise title still boost mother flash tuna")
            .secondSign("craft imitate step mixture patch forest volcano business charge around girl confirm")
            .build();
    });

    describe("bootstrap", () => {
        it("should resolve", async () => {
            mockTransaction = ipfsTransaction;
            await expect(handler.bootstrap()).toResolve();
        })
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotBeApplied(ipfsTransaction, senderWallet, walletRepository)).toResolve();
        });

        it("should not throw - second sign", async () => {
            await expect(handler.throwIfCannotBeApplied(secondSignatureIpfsTransaction, secondSignatureWallet, walletRepository)).toResolve();
        });

        it("should throw if wallet has insufficient funds", async () => {
            senderWallet.balance = Utils.BigNumber.ZERO;

            await expect(handler.throwIfCannotBeApplied(ipfsTransaction, senderWallet, walletRepository)).rejects.toThrow(
                InsufficientBalanceError,
            );
        });

        it("should throw if hash already exists", async () => {
            await expect(handler.throwIfCannotBeApplied(ipfsTransaction, senderWallet, walletRepository)).toResolve();
            await expect(handler.apply(ipfsTransaction, walletRepository)).toResolve();
            await expect(handler.throwIfCannotBeApplied(ipfsTransaction, senderWallet, walletRepository)).rejects.toThrow(
                IpfsHashAlreadyExists,
            );
        });
    });

    describe("apply", () => {
        it("should apply ipfs transaction", async () => {
            await expect(handler.throwIfCannotBeApplied(ipfsTransaction, senderWallet, walletRepository)).toResolve();

            const balanceBefore = senderWallet.balance;

            await handler.apply(ipfsTransaction, walletRepository);

            expect(
                senderWallet.getAttribute<Contracts.State.WalletIpfsAttributes>("ipfs.hashes")[ipfsTransaction.data.asset!.ipfs!],
            ).toBeTrue();
            expect(senderWallet.balance).toEqual(balanceBefore.minus(ipfsTransaction.data.fee));
        });
    });

    describe("revert", () => {
        it("should be ok", async () => {
            await expect(handler.throwIfCannotBeApplied(ipfsTransaction, senderWallet, walletRepository)).toResolve();

            const balanceBefore = senderWallet.balance;

            await handler.apply(ipfsTransaction, walletRepository);

            expect(senderWallet.balance).toEqual(balanceBefore.minus(ipfsTransaction.data.fee));
            expect(
                senderWallet.getAttribute<Contracts.State.WalletIpfsAttributes>("ipfs.hashes")[ipfsTransaction.data.asset!.ipfs!],
            ).toBeTrue();

            await handler.revert(ipfsTransaction, walletRepository);

            expect(senderWallet.hasAttribute("ipfs")).toBeFalse();
            expect(senderWallet.balance).toEqual(balanceBefore);
        });
    });
});

describe("MultiPaymentTransaction", () => {
    let multiPaymentTransaction: Interfaces.ITransaction;
    let secondSignatureMultiPaymentTransaction: Interfaces.ITransaction;
    let handler: TransactionHandler;

    beforeEach(async () => {
        const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);
        handler = transactionHandlerRegistry.getRegisteredHandlerByType(Transactions.InternalTransactionType.from(Enums.TransactionType.MultiPayment, Enums.TransactionTypeGroup.Core), 2);

        multiPaymentTransaction = BuilderFactory.multiPayment()
            .addPayment("ARYJmeYHSUTgbxaiqsgoPwf6M3CYukqdKN", "10")
            .addPayment("AFyjB5jULQiYNsp37wwipCm9c7V1xEzTJD", "20")
            .addPayment("AJwD3UJM7UESFnP1fsKYr4EX9Gc1EJNSqm", "30")
            .addPayment("AUsi9ZcFkcwG7WMpRE121TR4HaTjnAP7qD", "40")
            .addPayment("ARugw4i18i2pVnYZEMWKJj2mAnQQ97wuat", "50")
            .nonce("1")
            .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire")
            .build();

        secondSignatureMultiPaymentTransaction = BuilderFactory.multiPayment()
            .addPayment("ARYJmeYHSUTgbxaiqsgoPwf6M3CYukqdKN", "10")
            .addPayment("AFyjB5jULQiYNsp37wwipCm9c7V1xEzTJD", "20")
            .addPayment("AJwD3UJM7UESFnP1fsKYr4EX9Gc1EJNSqm", "30")
            .addPayment("AUsi9ZcFkcwG7WMpRE121TR4HaTjnAP7qD", "40")
            .addPayment("ARugw4i18i2pVnYZEMWKJj2mAnQQ97wuat", "50")
            .nonce("1")
            .sign("venue below waste gather spin cruise title still boost mother flash tuna")
            .secondSign("craft imitate step mixture patch forest volcano business charge around girl confirm")
            .build();
    });

    describe("bootstrap", () => {
        it("should resolve", async () => {
            mockTransaction = multiPaymentTransaction;
            await expect(handler.bootstrap()).toResolve();
        })
    });

    describe("throwIfCannotEnterPool", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotBeApplied(multiPaymentTransaction, senderWallet, walletRepository)).toResolve();
        });

        it("should not throw - second sign", async () => {
            await expect(handler.throwIfCannotBeApplied(secondSignatureMultiPaymentTransaction, secondSignatureWallet, walletRepository)).toResolve();
        });

        it("should throw if wallet has insufficient funds", async () => {
            senderWallet.balance = Utils.BigNumber.ZERO;
            await expect(handler.throwIfCannotBeApplied(multiPaymentTransaction, senderWallet, walletRepository)).rejects.toThrow(
                InsufficientBalanceError,
            );
        });

        it("should throw if wallet has insufficient funds send all payouts", async () => {
            senderWallet.balance = Utils.BigNumber.make(150); // short by the fee
            await expect(handler.throwIfCannotBeApplied(multiPaymentTransaction, senderWallet, walletRepository)).rejects.toThrow(
                InsufficientBalanceError,
            );
        });
    });

    describe("apply", () => {
        it("should be ok", async () => {
            const senderBalance = senderWallet.balance;
            const totalPaymentsAmount = multiPaymentTransaction.data.asset!.payments!.reduce(
                (prev, curr) => prev.plus(curr.amount),
                Utils.BigNumber.ZERO,
            );

            await handler.apply(multiPaymentTransaction, walletRepository);

            expect(senderWallet.balance).toEqual(
                Utils.BigNumber.make(senderBalance)
                    .minus(totalPaymentsAmount)
                    .minus(multiPaymentTransaction.data.fee),
            );

            for (const { recipientId, amount } of multiPaymentTransaction.data.asset!.payments!) {
                const paymentRecipientWallet = walletRepository.findByAddress(recipientId);
                expect(paymentRecipientWallet.balance).toEqual(amount);
            }
        });
    });

    describe("revert", () => {
        it("should be ok", async () => {
            const senderBalance = senderWallet.balance;
            senderWallet.nonce = Utils.BigNumber.make(1);

            for (const { recipientId, amount } of multiPaymentTransaction.data.asset!.payments!) {
                const paymentRecipientWallet = walletRepository.findByAddress(recipientId);
                paymentRecipientWallet.balance = amount;
            }
            const totalPaymentsAmount = multiPaymentTransaction.data.asset!.payments!.reduce(
                (prev, curr) => prev.plus(curr.amount),
                Utils.BigNumber.ZERO,
            );

            await handler.revert(multiPaymentTransaction, walletRepository);
            expect(senderWallet.balance).toEqual(
                Utils.BigNumber.make(senderBalance)
                    .plus(totalPaymentsAmount)
                    .plus(multiPaymentTransaction.data.fee),
            );

            expect(senderWallet.nonce.isZero()).toBeTrue();
            expect(recipientWallet.balance).toEqual(Utils.BigNumber.ZERO);
        });
    });
});

describe.each([EpochTimestamp, BlockHeight])("Htlc lock - expiration type %i", expirationType => {
    let htlcLockTransaction: Interfaces.ITransaction;
    let secondSignatureHtlcLockTransaction: Interfaces.ITransaction;
    let handler: TransactionHandler;

    beforeAll(() => {
        Managers.configManager.setFromPreset("testnet");
    });

    beforeEach(async () => {
        const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);
        handler = transactionHandlerRegistry.getRegisteredHandlerByType(Transactions.InternalTransactionType.from(Enums.TransactionType.HtlcLock, Enums.TransactionTypeGroup.Core), 2);

        let expiration = {
            type: expirationType,
            value: makeNotExpiredTimestamp(expirationType),
        };

        htlcLockTransaction = BuilderFactory.htlcLock()
            .htlcLockAsset({
                secretHash: htlcSecretHashHex,
                expiration: expiration
            })
            .recipientId(recipientWallet.address)
            .amount("1")
            .nonce("1")
            .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire")
            .build();

        secondSignatureHtlcLockTransaction = BuilderFactory.htlcLock()
            .htlcLockAsset({
                secretHash: htlcSecretHashHex,
                expiration: expiration
            })
            .recipientId(recipientWallet.address)
            .amount("1")
            .nonce("1")
            .sign("venue below waste gather spin cruise title still boost mother flash tuna")
            .secondSign("craft imitate step mixture patch forest volcano business charge around girl confirm")
            .build();
    });

    describe("bootstrap", () => {
        it("should resolve", async () => {
            mockTransaction = htlcLockTransaction;
            await expect(handler.bootstrap()).toResolve();
        })
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotBeApplied(htlcLockTransaction, senderWallet, walletRepository)).toResolve();
        });

        it("should not throw - second sign", async () => {
            await expect(handler.throwIfCannotBeApplied(secondSignatureHtlcLockTransaction, secondSignatureWallet, walletRepository)).toResolve();
        });

        it("should throw if wallet has insufficient funds", async () => {
            senderWallet.balance = Utils.BigNumber.ZERO;

            await expect(handler.throwIfCannotBeApplied(htlcLockTransaction, senderWallet, walletRepository)).rejects.toThrow(
                InsufficientBalanceError,
            );
        });

        it("should throw if lock is already expired", async () => {
            delete process.env.CORE_ENV;

            if (expirationType === Enums.HtlcLockExpirationType.BlockHeight) {
                htlcLockTransaction.data.asset!.lock!.expiration.value = 4;
            } else {
                htlcLockTransaction.data.asset!.lock!.expiration.value = Crypto.Slots.getTime();
            }

            await expect(handler.throwIfCannotBeApplied(htlcLockTransaction, senderWallet, walletRepository)).rejects.toThrow(
                HtlcLockExpiredError,
            );

            if (expirationType === Enums.HtlcLockExpirationType.BlockHeight) {
                htlcLockTransaction.data.asset!.lock!.expiration.value = 1000;
            } else {
                htlcLockTransaction.data.asset!.lock!.expiration.value = Crypto.Slots.getTime() + 10000;
            }

            await expect(handler.throwIfCannotBeApplied(htlcLockTransaction, senderWallet, walletRepository)).toResolve();

            process.env.CORE_ENV = "test";
        });
    });

    describe("apply", () => {
        it("should apply htlc lock transaction", async () => {
            await expect(handler.throwIfCannotBeApplied(htlcLockTransaction, senderWallet, walletRepository)).toResolve();

            const balanceBefore = senderWallet.balance;

            await handler.apply(htlcLockTransaction, walletRepository);

            expect(senderWallet.getAttribute("htlc.locks", {})[htlcLockTransaction.id!]).toBeDefined();
            expect(senderWallet.getAttribute("htlc.lockedBalance")).toEqual(htlcLockTransaction.data.amount);
            expect(senderWallet.balance).toEqual(balanceBefore.minus(htlcLockTransaction.data.fee).minus(htlcLockTransaction.data.amount));
        });
    });

    describe("revert", () => {
        it("should be ok", async () => {
            await expect(handler.throwIfCannotBeApplied(htlcLockTransaction, senderWallet, walletRepository)).toResolve();

            const balanceBefore = senderWallet.balance;

            await handler.apply(htlcLockTransaction, walletRepository);

            expect(senderWallet.getAttribute("htlc.locks", {})[htlcLockTransaction.id!]).toBeDefined();
            expect(senderWallet.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO)).toEqual(htlcLockTransaction.data.amount);
            expect(senderWallet.balance).toEqual(balanceBefore.minus(htlcLockTransaction.data.fee).minus(htlcLockTransaction.data.amount));

            await handler.revert(htlcLockTransaction, walletRepository);

            expect(senderWallet.getAttribute("htlc.locks", {})[htlcLockTransaction.id!]).toBeUndefined();
            expect(senderWallet.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO)).toEqual(Utils.BigNumber.ZERO);
            expect(senderWallet.balance).toEqual(balanceBefore);
        });
    });
});

describe.each([EpochTimestamp, BlockHeight])("Htlc claim - expiration type %i", expirationType => {
    let htlcLockTransaction: Interfaces.ITransaction;
    let htlcClaimTransaction: Interfaces.ITransaction;
    let secondSignHtlcClaimTransaction: Interfaces.ITransaction;
    let handler: TransactionHandler;
    let lockWallet: Wallets.Wallet;
    let claimWallet: Wallets.Wallet;

    const lockPassphrase = "craft imitate step mixture patch forest volcano business charge around girl confirm";
    const claimPassphrase = "fatal hat sail asset chase barrel pluck bag approve coral slab bright";

    const amount = 6 * 1e8;

    beforeAll(() => {
        Managers.configManager.setFromPreset("testnet");
    });

    beforeEach(async () => {
        const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);
        handler = transactionHandlerRegistry.getRegisteredHandlerByType(Transactions.InternalTransactionType.from(Enums.TransactionType.HtlcClaim, Enums.TransactionTypeGroup.Core), 2);

        claimWallet = factoryBuilder
            .get("Wallet")
            .withOptions({
                passphrase: claimPassphrase,
                nonce: 0
            })
            .make();

        lockWallet = factoryBuilder
            .get("Wallet")
            .withOptions({
                passphrase: lockPassphrase,
                nonce: 0
            })
            .make();

        walletRepository.reindex(lockWallet);
        walletRepository.reindex(claimWallet);

        let expiration = {
            type: expirationType,
            value: makeNotExpiredTimestamp(expirationType),
        };

        htlcLockTransaction = BuilderFactory.htlcLock()
            .htlcLockAsset({
                secretHash: htlcSecretHashHex,
                expiration: expiration
            })
            .recipientId(claimWallet.address)
            .amount(amount.toString())
            .nonce("1")
            .sign(lockPassphrase)
            .build();

        lockWallet.setAttribute("htlc.lockedBalance", Utils.BigNumber.make(amount));

        lockWallet.setAttribute("htlc.locks", {
            [htlcLockTransaction.id!]: {
                amount: htlcLockTransaction.data.amount,
                recipientId: htlcLockTransaction.data.recipientId,
                ...htlcLockTransaction.data.asset!.lock,
            },
        });

        walletRepository.reindex(lockWallet);

        htlcClaimTransaction = BuilderFactory.htlcClaim()
            .htlcClaimAsset({
                unlockSecret: htlcSecretHex,
                lockTransactionId: htlcLockTransaction.id!,
            })
            .nonce("1")
            .sign(claimPassphrase)
            .build();

        secondSignHtlcClaimTransaction = BuilderFactory.htlcClaim()
            .htlcClaimAsset({
                unlockSecret: htlcSecretHex,
                lockTransactionId: htlcLockTransaction.id!,
            })
            .nonce("1")
            .sign("venue below waste gather spin cruise title still boost mother flash tuna")
            .secondSign("craft imitate step mixture patch forest volcano business charge around girl confirm")
            .build();
    });

    describe("bootstrap", () => {
        it("should resolve", async () => {
            mockTransaction = htlcLockTransaction;
            await expect(handler.bootstrap()).toResolve();
        })
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotBeApplied(htlcClaimTransaction, claimWallet, walletRepository)).toResolve();
        });

        it("should not throw - second sign", async () => {
            await expect(handler.throwIfCannotBeApplied(secondSignHtlcClaimTransaction, secondSignatureWallet, walletRepository)).toResolve();
        });

        it("should throw if no wallet has a lock with associated transaction id", async () => {
            lockWallet.setAttribute("htlc.locks", {});

            await expect(handler.throwIfCannotBeApplied(htlcClaimTransaction, claimWallet, walletRepository)).rejects.toThrow(
                HtlcLockTransactionNotFoundError,
            );
        });

        it("should throw if secret hash does not match", async () => {
            htlcClaimTransaction = BuilderFactory.htlcClaim()
                .htlcClaimAsset({
                    unlockSecret: "00000000000000000000000000000000",
                    lockTransactionId: htlcLockTransaction.id!
                })
                .nonce("1")
                .sign(claimPassphrase)
                .build();

            await expect(handler.throwIfCannotBeApplied(htlcClaimTransaction, claimWallet, walletRepository)).rejects.toThrow(
                HtlcSecretHashMismatchError,
            );
        });

        it("should not throw if claiming wallet is not recipient of lock transaction", async () => {
            const dummyPassphrase = "not recipient of lock";
            const dummyWallet: Wallets.Wallet = factoryBuilder
                .get("Wallet")
                .withOptions({
                    passphrase: dummyPassphrase,
                    nonce: 0
                })
                .make();

            walletRepository.reindex(dummyWallet);

            htlcClaimTransaction = BuilderFactory.htlcClaim()
                .htlcClaimAsset({
                    unlockSecret: htlcSecretHex,
                    lockTransactionId: htlcLockTransaction.id!
                })
                .sign(dummyPassphrase)
                .nonce("1")
                .build();

            await expect(handler.throwIfCannotBeApplied(htlcClaimTransaction, dummyWallet, walletRepository)).toResolve();
        });

        it("should throw if lock expired", async () => {
            const amount = 1e9;
            let expiration = {
                type: expirationType,
                value: makeExpiredTimestamp(expirationType),
            };

            htlcLockTransaction = BuilderFactory.htlcLock()
                .htlcLockAsset({
                    secretHash: htlcSecretHashHex,
                    expiration: expiration
                })
                .recipientId(claimWallet.address)
                .amount(amount.toString())
                .nonce("1")
                .sign(lockPassphrase)
                .build();


            lockWallet.setAttribute("htlc.lockedBalance", Utils.BigNumber.make(amount));

            lockWallet.setAttribute("htlc.locks", {
                [htlcLockTransaction.id!]: {
                    amount: htlcLockTransaction.data.amount,
                    recipientId: htlcLockTransaction.data.recipientId,
                    ...htlcLockTransaction.data.asset!.lock,
                },
            });

            walletRepository.reindex(lockWallet);

            htlcClaimTransaction = BuilderFactory.htlcClaim()
                .htlcClaimAsset({
                    unlockSecret: htlcSecretHex,
                    lockTransactionId: htlcLockTransaction.id!
                })
                .sign(claimPassphrase)
                .nonce("1")
                .build();

            await expect(handler.throwIfCannotBeApplied(htlcClaimTransaction, claimWallet, walletRepository)).rejects.toThrow(
                HtlcLockExpiredError,
            );
        });
    });

    describe("throwIfCannotEnterPool", () => {
        it("should not throw", async () => {
            await expect(
                handler.throwIfCannotEnterPool(
                    htlcClaimTransaction
                ),
            ).toResolve();
        });

        it("should throw if no wallet has a lock with associated transaction id", async () => {
            lockWallet.setAttribute("htlc.locks", {});

            await expect(handler.throwIfCannotEnterPool(htlcClaimTransaction)).rejects.toThrow(Contracts.TransactionPool.PoolError);
        });

        it("should throw if transaction by sender already in pool", async () => {
            app.get<Memory>(Identifiers.TransactionPoolMemory).remember(htlcClaimTransaction);

            await expect(handler.throwIfCannotEnterPool(htlcClaimTransaction)).rejects.toThrow(Contracts.TransactionPool.PoolError);
        });
    });

    describe("apply",  () => {
        it("should apply htlc claim transaction", async () => {
            await expect(handler.throwIfCannotBeApplied(htlcClaimTransaction, claimWallet, walletRepository)).toResolve();

            const balanceBefore = claimWallet.balance;

            expect(lockWallet.getAttribute("htlc.locks")).toBeDefined();
            expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(htlcLockTransaction.data.amount);

            await handler.apply(htlcClaimTransaction, walletRepository);

            expect(lockWallet.getAttribute("htlc.locks")).toBeEmpty();
            expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(Utils.BigNumber.ZERO);
            expect(claimWallet.balance).toEqual(balanceBefore.plus(htlcLockTransaction.data.amount).minus(htlcClaimTransaction.data.fee));
        });

        it("should apply htlc claim transaction - when sender is not claim wallet", async () => {
            const dummyPassphrase = "not recipient of lock";
            const dummyWallet: Wallets.Wallet = factoryBuilder
                .get("Wallet")
                .withOptions({
                    passphrase: dummyPassphrase,
                    nonce: 0
                })
                .make();

            walletRepository.reindex(dummyWallet);

            htlcClaimTransaction = BuilderFactory.htlcClaim()
                .htlcClaimAsset({
                    unlockSecret: htlcSecretHex,
                    lockTransactionId: htlcLockTransaction.id!
                })
                .sign(dummyPassphrase)
                .nonce("1")
                .build();

            await expect(handler.throwIfCannotBeApplied(htlcClaimTransaction, dummyWallet, walletRepository)).toResolve();

            const balanceBefore = claimWallet.balance;

            expect(lockWallet.getAttribute("htlc.locks")).not.toBeEmpty();
            expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(htlcLockTransaction.data.amount);

            await handler.apply(htlcClaimTransaction, walletRepository);

            expect(lockWallet.getAttribute("htlc.locks")).toBeEmpty();
            expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(Utils.BigNumber.ZERO);
            expect(claimWallet.balance).toEqual(balanceBefore.plus(htlcLockTransaction.data.amount).minus(htlcClaimTransaction.data.fee));
        });

        describe("revert", () => {
            it("should be ok", async () => {
                await expect(handler.throwIfCannotBeApplied(htlcClaimTransaction, claimWallet, walletRepository)).toResolve();

                mockTransaction = htlcLockTransaction;
                const balanceBefore = claimWallet.balance;

                await handler.apply(htlcClaimTransaction, walletRepository);

                expect(lockWallet.getAttribute("htlc.locks")).toBeEmpty();
                expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(Utils.BigNumber.ZERO);
                expect(claimWallet.balance).toEqual(balanceBefore.plus(htlcLockTransaction.data.amount).minus(htlcClaimTransaction.data.fee));

                await handler.revert(htlcClaimTransaction, walletRepository);

                let foundLockWallet = walletRepository.findByIndex(Contracts.State.WalletIndexes.Locks, htlcLockTransaction.id!);

                expect(foundLockWallet).toBeDefined();
                // @ts-ignore
                expect(lockWallet.getAttribute("htlc.locks")[htlcLockTransaction.id]).toEqual({
                    amount: htlcLockTransaction.data.amount,
                    recipientId: htlcLockTransaction.data.recipientId,
                    ...htlcLockTransaction.data.asset!.lock,
                });

                expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(htlcLockTransaction.data.amount);
                expect(claimWallet.balance).toEqual(balanceBefore);
            });
        });
    });
});

describe.each([EpochTimestamp, BlockHeight])("Htlc refund - expiration type %i", expirationType => {
    const lockPassphrase = "craft imitate step mixture patch forest volcano business charge around girl confirm";
    let htlcLockTransaction: Interfaces.ITransaction;
    let htlcRefundTransaction: Interfaces.ITransaction;
    let secondSignatureHtlcRefundTransaction: Interfaces.ITransaction;
    let handler: TransactionHandler;
    let lockWallet: Wallets.Wallet;

    beforeAll(() => {
        Managers.configManager.setFromPreset("testnet");
    });

    beforeEach(async () => {
        const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);
        handler = transactionHandlerRegistry.getRegisteredHandlerByType(Transactions.InternalTransactionType.from(Enums.TransactionType.HtlcRefund, Enums.TransactionTypeGroup.Core), 2);

        lockWallet = factoryBuilder
            .get("Wallet")
            .withOptions({
                passphrase: lockPassphrase,
                nonce: 0
            })
            .make();

        walletRepository.reindex(lockWallet);

        const amount = 6 * 1e8;
        let expiration = {
            type: expirationType,
            value: makeExpiredTimestamp(expirationType),
        };

        htlcLockTransaction = BuilderFactory.htlcLock()
            .htlcLockAsset({
                secretHash: htlcSecretHashHex,
                expiration: expiration
            })
            .recipientId(recipientWallet.address)
            .amount(amount.toString())
            .nonce("1")
            .sign(lockPassphrase)
            .build();

        lockWallet.setAttribute("htlc.lockedBalance", Utils.BigNumber.make(amount));

        lockWallet.setAttribute("htlc.locks", {
            [htlcLockTransaction.id!]: {
                amount: htlcLockTransaction.data.amount,
                recipientId: htlcLockTransaction.data.recipientId,
                ...htlcLockTransaction.data.asset!.lock,
            },
        });

        walletRepository.reindex(lockWallet);

        htlcRefundTransaction = BuilderFactory.htlcRefund()
            .htlcRefundAsset({
                lockTransactionId: htlcLockTransaction.id!
            })
            .nonce("1")
            .sign(lockPassphrase)
            .build();

        secondSignatureHtlcRefundTransaction = BuilderFactory.htlcRefund()
            .htlcRefundAsset({
                lockTransactionId: htlcLockTransaction.id!
            })
            .nonce("1")
            .sign("venue below waste gather spin cruise title still boost mother flash tuna")
            .secondSign("craft imitate step mixture patch forest volcano business charge around girl confirm")
            .build();
    });

    describe("bootstrap", () => {
        it("should resolve", async () => {
            mockTransaction = htlcLockTransaction;
            await expect(handler.bootstrap()).toResolve();
        })
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotBeApplied(htlcRefundTransaction, lockWallet, walletRepository)).toResolve();
        });

        it("should not throw - second sign", async () => {
            await expect(handler.throwIfCannotBeApplied(secondSignatureHtlcRefundTransaction, secondSignatureWallet, walletRepository)).toResolve();
        });

        it("should throw if no wallet has a lock with associated transaction id", async () => {
            lockWallet.setAttribute("htlc.locks", {});

            await expect(handler.throwIfCannotBeApplied(htlcRefundTransaction, lockWallet, walletRepository)).rejects.toThrow(
                HtlcLockTransactionNotFoundError,
            );
        });

        it("should not throw if refund wallet is not sender of lock transaction", async () => {
            const dummyPassphrase = "not recipient of lock";
            const dummyWallet: Wallets.Wallet = factoryBuilder
                .get("Wallet")
                .withOptions({
                    passphrase: dummyPassphrase,
                    nonce: 0
                })
                .make();

            walletRepository.reindex(dummyWallet);

            htlcRefundTransaction = BuilderFactory.htlcRefund()
                .htlcRefundAsset({
                    lockTransactionId: htlcLockTransaction.id!
                })
                .nonce("1")
                .sign(dummyPassphrase)
                .build();

            await expect(handler.throwIfCannotBeApplied(htlcRefundTransaction, dummyWallet, walletRepository)).toResolve();
        });

        it("should throw if lock didn't expire - expiration type %i", async () => {
            const amount = 6 * 1e8;
            let expiration = {
                type: expirationType,
                value: makeNotExpiredTimestamp(expirationType),
            };

            htlcLockTransaction = BuilderFactory.htlcLock()
                .htlcLockAsset({
                    secretHash: htlcSecretHashHex,
                    expiration: expiration
                })
                .recipientId(recipientWallet.address)
                .amount(amount.toString())
                .nonce("1")
                .sign(lockPassphrase)
                .build();

            lockWallet.setAttribute("htlc.lockedBalance", Utils.BigNumber.make(amount));

            lockWallet.setAttribute("htlc.locks", {
                [htlcLockTransaction.id!]: {
                    amount: htlcLockTransaction.data.amount,
                    recipientId: htlcLockTransaction.data.recipientId,
                    ...htlcLockTransaction.data.asset!.lock,
                },
            });

            walletRepository.reindex(lockWallet);

            htlcRefundTransaction = BuilderFactory.htlcRefund()
                .htlcRefundAsset({
                    lockTransactionId: htlcLockTransaction.id!
                })
                .nonce("1")
                .sign(lockPassphrase)
                .build();


            await expect(handler.throwIfCannotBeApplied(htlcRefundTransaction, lockWallet, walletRepository
            )).rejects.toThrow(
                HtlcLockNotExpiredError,
            );
        });
    });

    describe("throwIfCannotEnterPool", () => {
        it("should not throw", async () => {
            await expect(
                handler.throwIfCannotEnterPool(
                    htlcRefundTransaction
                ),
            ).toResolve();
        });

        it("should throw if no wallet has a lock with associated transaction id", async () => {
            lockWallet.setAttribute("htlc.locks", {});

            await expect(handler.throwIfCannotEnterPool(htlcRefundTransaction)).rejects.toThrowError(Contracts.TransactionPool.PoolError);
        });

        it("should throw if transaction by sender already in pool", async () => {
            app.get<Memory>(Identifiers.TransactionPoolMemory).remember(htlcRefundTransaction);

            await expect(handler.throwIfCannotEnterPool(htlcRefundTransaction)).rejects.toThrow(Contracts.TransactionPool.PoolError);
        });
    });

    describe("apply", () => {
        it("should apply htlc refund transaction", async () => {
            await expect(handler.throwIfCannotBeApplied(htlcRefundTransaction, lockWallet, walletRepository)).toResolve();

            const balanceBefore = lockWallet.balance;

            // @ts-ignore
            expect(lockWallet.getAttribute("htlc.locks")[htlcLockTransaction.id]).toBeDefined();
            expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(htlcLockTransaction.data.amount);

            await handler.apply(htlcRefundTransaction, walletRepository);

            expect(lockWallet.getAttribute("htlc.locks")).toBeEmpty();
            expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(Utils.BigNumber.ZERO);
            expect(lockWallet.balance).toEqual(balanceBefore.plus(htlcLockTransaction.data.amount).minus(htlcRefundTransaction.data.fee));
        });

        it("should apply htlc refund transaction - when sender is not refund wallet", async () => {
            const dummyPassphrase = "not recipient of lock";
            const dummyWallet: Wallets.Wallet = factoryBuilder
                .get("Wallet")
                .withOptions({
                    passphrase: dummyPassphrase,
                    nonce: 0
                })
                .make();

            walletRepository.reindex(dummyWallet);

            htlcRefundTransaction = BuilderFactory.htlcRefund()
                .htlcRefundAsset({
                    lockTransactionId: htlcLockTransaction.id!
                })
                .nonce("1")
                .sign(dummyPassphrase)
                .build();

            await expect(handler.throwIfCannotBeApplied(htlcRefundTransaction, dummyWallet, walletRepository)).toResolve();

            const balanceBefore = lockWallet.balance;

            // @ts-ignore
            expect(lockWallet.getAttribute("htlc.locks")[htlcLockTransaction.id]).toBeDefined();
            expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(htlcLockTransaction.data.amount);

            await handler.apply(htlcRefundTransaction, walletRepository);

            expect(lockWallet.getAttribute("htlc.locks")).toBeEmpty();
            expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(Utils.BigNumber.ZERO);
            expect(lockWallet.balance).toEqual(balanceBefore.plus(htlcLockTransaction.data.amount).minus(htlcRefundTransaction.data.fee));
        });
    });

    describe("revert", () => {
        it("should be ok", async () => {
            await expect(handler.throwIfCannotBeApplied(htlcRefundTransaction, lockWallet, walletRepository)).toResolve();

            mockTransaction = htlcLockTransaction;
            const balanceBefore = lockWallet.balance;

            await handler.apply(htlcRefundTransaction, walletRepository);

            // @ts-ignore
            expect(lockWallet.getAttribute("htlc.locks")[htlcLockTransaction.id]).toBeUndefined();
            expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(Utils.BigNumber.ZERO);
            expect(lockWallet.balance).toEqual(balanceBefore.plus(htlcLockTransaction.data.amount).minus(htlcRefundTransaction.data.fee));

            await handler.revert(htlcRefundTransaction, walletRepository);

            const foundLockWallet = walletRepository.findByIndex(Contracts.State.WalletIndexes.Locks, htlcLockTransaction.id!);
            expect(foundLockWallet).toBeDefined();
            expect(foundLockWallet.getAttribute("htlc.locks")[htlcLockTransaction.id!]).toEqual({
                amount: htlcLockTransaction.data.amount,
                recipientId: htlcLockTransaction.data.recipientId,
                ...htlcLockTransaction.data.asset!.lock,
            });

            expect(foundLockWallet.getAttribute("htlc.lockedBalance")).toEqual(htlcLockTransaction.data.amount);
            expect(foundLockWallet.balance).toEqual(balanceBefore);
        });
    });
});
