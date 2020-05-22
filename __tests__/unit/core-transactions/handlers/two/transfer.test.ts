import "jest-extended";

import { Application, Contracts } from "@packages/core-kernel";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { Wallets } from "@packages/core-state";
import { StateStore } from "@packages/core-state/src/stores/state";
import { Mapper, Mocks } from "@packages/core-test-framework/src";
import { Generators } from "@packages/core-test-framework/src";
import { Factories, FactoryBuilder } from "@packages/core-test-framework/src/factories";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import {
    ColdWalletError,
    InsufficientBalanceError,
    SenderWalletMismatchError,
} from "@packages/core-transactions/src/errors";
import { TransactionHandler } from "@packages/core-transactions/src/handlers";
import { TransactionHandlerRegistry } from "@packages/core-transactions/src/handlers/handler-registry";
import { TransferTransactionHandler } from "@packages/core-transactions/src/handlers/one";

import {
    buildMultiSignatureWallet,
    buildRecipientWallet,
    buildSecondSignatureWallet,
    buildSenderWallet,
    initApp,
} from "../__support__/app";
import { CryptoSuite, Interfaces as BlockInterfaces } from "../../../../../packages/core-crypto/src";
import { Enums, Interfaces, Transactions } from "../../../../../packages/crypto";

let app: Application;
let senderWallet: Wallets.Wallet;
let secondSignatureWallet: Wallets.Wallet;
let multiSignatureWallet: Wallets.Wallet;
let recipientWallet: Wallets.Wallet;
let walletRepository: Contracts.State.WalletRepository;
let factoryBuilder: FactoryBuilder;

let mockLastBlockData: Partial<BlockInterfaces.IBlockData>;

let crypto: CryptoSuite.CryptoSuite;

beforeEach(() => {
    crypto = new CryptoSuite.CryptoSuite({
        ...Generators.generateCryptoConfigRaw(),
    });
    crypto.CryptoManager.HeightTracker.setHeight(2);

    app = initApp(crypto);

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    mockLastBlockData = { timestamp: crypto.CryptoManager.LibraryManager.Crypto.Slots.getTime(), height: 4 };

    const mockGetLastBlock = jest.fn();
    StateStore.prototype.getLastBlock = mockGetLastBlock;
    mockGetLastBlock.mockReturnValue({ data: mockLastBlockData });

    factoryBuilder = new FactoryBuilder(crypto as any);
    Factories.registerWalletFactory(factoryBuilder);
    Factories.registerTransactionFactory(factoryBuilder);

    senderWallet = buildSenderWallet(factoryBuilder, crypto.CryptoManager);
    secondSignatureWallet = buildSecondSignatureWallet(factoryBuilder, crypto.CryptoManager);
    multiSignatureWallet = buildMultiSignatureWallet(crypto.CryptoManager);
    recipientWallet = buildRecipientWallet(factoryBuilder);

    walletRepository.index(senderWallet);
    walletRepository.index(secondSignatureWallet);
    walletRepository.index(recipientWallet);
    walletRepository.index(multiSignatureWallet);
});

afterEach(() => {
    Mocks.TransactionRepository.setTransactions([]);
});

describe("TransferTransaction", () => {
    let transferTransaction: Interfaces.ITransaction;
    let secondSignatureTransferTransaction: Interfaces.ITransaction;
    let multiSignatureTransferTransaction: Interfaces.ITransaction;
    let handler: TransactionHandler;

    beforeEach(async () => {
        const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(
            Identifiers.TransactionHandlerRegistry,
        );
        handler = transactionHandlerRegistry.getRegisteredHandlerByType(
            Transactions.InternalTransactionType.from(Enums.TransactionType.Transfer, Enums.TransactionTypeGroup.Core),
            2,
        );

        transferTransaction = crypto.TransactionManager.BuilderFactory.transfer()
            .recipientId(recipientWallet.address)
            .amount("10000000")
            .sign(passphrases[0])
            .nonce("1")
            .build();

        secondSignatureTransferTransaction = crypto.TransactionManager.BuilderFactory.transfer()
            .recipientId(recipientWallet.address)
            .amount("1")
            .nonce("1")
            .sign(passphrases[1])
            .secondSign(passphrases[2])
            .build();

        multiSignatureTransferTransaction = crypto.TransactionManager.BuilderFactory.transfer()
            .senderPublicKey(multiSignatureWallet.publicKey!)
            .recipientId(recipientWallet.address)
            .amount("1")
            .nonce("1")
            .multiSign(passphrases[0], 0)
            .multiSign(passphrases[1], 1)
            .multiSign(passphrases[2], 2)
            .build();
    });

    describe("bootstrap", () => {
        it("should resolve", async () => {
            Mocks.TransactionRepository.setTransactions([Mapper.mapTransactionToModel(transferTransaction)]);
            await expect(handler.bootstrap()).toResolve();
        });
    });

    describe("hasVendorField", () => {
        it("should return true", async () => {
            await expect((<TransferTransactionHandler>handler).hasVendorField()).toBeTrue();
        });
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", async () => {
            await expect(
                handler.throwIfCannotBeApplied(transferTransaction, senderWallet, walletRepository),
            ).toResolve();
        });

        it("should not throw - second sign", async () => {
            await expect(
                handler.throwIfCannotBeApplied(
                    secondSignatureTransferTransaction,
                    secondSignatureWallet,
                    walletRepository,
                ),
            ).toResolve();
        });

        it("should not throw - multi sign", async () => {
            await expect(
                handler.throwIfCannotBeApplied(
                    multiSignatureTransferTransaction,
                    multiSignatureWallet,
                    walletRepository,
                ),
            ).toResolve();
        });

        it("should throw", async () => {
            transferTransaction.data.senderPublicKey = "a".repeat(66);
            await expect(
                handler.throwIfCannotBeApplied(transferTransaction, senderWallet, walletRepository),
            ).rejects.toThrow(SenderWalletMismatchError);
        });

        it("should throw if wallet has insufficient funds for vote", async () => {
            senderWallet.balance = crypto.CryptoManager.LibraryManager.Libraries.BigNumber.ZERO;
            await expect(
                handler.throwIfCannotBeApplied(transferTransaction, senderWallet, walletRepository),
            ).rejects.toThrow(InsufficientBalanceError);
        });

        it("should throw if sender is cold wallet", async () => {
            const coldWallet: Wallets.Wallet = factoryBuilder
                .get("Wallet")
                .withOptions({
                    passphrase: passphrases[3],
                    nonce: 0,
                })
                .make();

            coldWallet.balance = crypto.CryptoManager.LibraryManager.Libraries.BigNumber.ZERO;

            transferTransaction = crypto.TransactionManager.BuilderFactory.transfer()
                .amount("10000000")
                .recipientId(recipientWallet.address)
                .nonce("1")
                .sign(passphrases[3])
                .build();

            await expect(
                handler.throwIfCannotBeApplied(transferTransaction, coldWallet, walletRepository),
            ).rejects.toThrow(ColdWalletError);
        });

        it("should not throw if recipient is cold wallet", async () => {
            const coldWallet: Wallets.Wallet = factoryBuilder
                .get("Wallet")
                .withOptions({
                    passphrase: passphrases[3],
                    nonce: 0,
                })
                .make();

            coldWallet.balance = crypto.CryptoManager.LibraryManager.Libraries.BigNumber.ZERO;

            transferTransaction = crypto.TransactionManager.BuilderFactory.transfer()
                .amount("10000000")
                .recipientId(coldWallet.address)
                .nonce("1")
                .sign(passphrases[0])
                .build();

            await expect(
                handler.throwIfCannotBeApplied(transferTransaction, senderWallet, walletRepository),
            ).toResolve();
        });
    });

    describe("throwIfCannotEnterPool", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotEnterPool(transferTransaction)).toResolve();
        });

        it("should throw if sender alreadyno wallet is not recipient on the active network", async () => {
            crypto.CryptoManager.NetworkConfigManager.set("network.pubKeyHash", 99);

            await expect(handler.throwIfCannotEnterPool(transferTransaction)).rejects.toThrow(
                Contracts.TransactionPool.PoolError,
            );
        });
    });

    describe("apply", () => {
        it("should be ok", async () => {
            const senderBalance = senderWallet.balance;
            const recipientBalance = recipientWallet.balance;

            await handler.apply(transferTransaction, walletRepository);

            expect(senderWallet.balance).toEqual(
                crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make(senderBalance)
                    .minus(transferTransaction.data.amount)
                    .minus(transferTransaction.data.fee),
            );

            expect(recipientWallet.balance).toEqual(
                crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make(recipientBalance).plus(
                    transferTransaction.data.amount,
                ),
            );
        });
    });

    describe("revert", () => {
        it("should be ok", async () => {
            const senderBalance = senderWallet.balance;
            const recipientBalance = recipientWallet.balance;

            await handler.apply(transferTransaction, walletRepository);

            expect(senderWallet.balance).toEqual(
                crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make(senderBalance)
                    .minus(transferTransaction.data.amount)
                    .minus(transferTransaction.data.fee),
            );

            expect(recipientWallet.balance).toEqual(
                crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make(recipientBalance).plus(
                    transferTransaction.data.amount,
                ),
            );

            await handler.revert(transferTransaction, walletRepository);

            expect(senderWallet.balance).toEqual(
                crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make(senderBalance),
            );

            expect(recipientWallet.balance).toEqual(recipientBalance);
        });
    });
});
