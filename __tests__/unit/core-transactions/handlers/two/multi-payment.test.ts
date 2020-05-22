import "jest-extended";

import { CryptoSuite, Interfaces as BlockInterfaces } from "@packages/core-crypto/src";
import { Application, Contracts } from "@packages/core-kernel";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { Wallets } from "@packages/core-state";
import { StateStore } from "@packages/core-state/src/stores/state";
import { Mapper, Mocks } from "@packages/core-test-framework/src";
import { Generators } from "@packages/core-test-framework/src";
import { Factories, FactoryBuilder } from "@packages/core-test-framework/src/factories";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import { InsufficientBalanceError } from "@packages/core-transactions/src/errors";
import { TransactionHandler } from "@packages/core-transactions/src/handlers";
import { TransactionHandlerRegistry } from "@packages/core-transactions/src/handlers/handler-registry";
import { Enums, Interfaces, Transactions } from "@packages/crypto";

import {
    buildMultiSignatureWallet,
    buildRecipientWallet,
    buildSecondSignatureWallet,
    buildSenderWallet,
    initApp,
} from "../__support__/app";

let app: Application;
let senderWallet: Wallets.Wallet;
let secondSignatureWallet: Wallets.Wallet;
let multiSignatureWallet: Wallets.Wallet;
let recipientWallet: Wallets.Wallet;
let walletRepository: Contracts.State.WalletRepository;
let factoryBuilder: FactoryBuilder;

let mockLastBlockData: Partial<BlockInterfaces.IBlockData>;
const mockGetLastBlock = jest.fn();
StateStore.prototype.getLastBlock = mockGetLastBlock;
mockGetLastBlock.mockReturnValue({ data: mockLastBlockData });

let crypto: CryptoSuite.CryptoSuite;

beforeEach(() => {
    crypto = new CryptoSuite.CryptoSuite({
        ...Generators.generateCryptoConfigRaw(),
    });
    crypto.CryptoManager.HeightTracker.setHeight(2);

    app = initApp(crypto);

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    mockLastBlockData = { timestamp: crypto.CryptoManager.LibraryManager.Crypto.Slots.getTime(), height: 4 };

    factoryBuilder = new FactoryBuilder();
    Factories.registerWalletFactory(factoryBuilder);
    Factories.registerTransactionFactory(factoryBuilder);

    senderWallet = buildSenderWallet(factoryBuilder, crypto.CryptoManager);
    secondSignatureWallet = buildSecondSignatureWallet(factoryBuilder, crypto.CryptoManager);
    multiSignatureWallet = buildMultiSignatureWallet(crypto.CryptoManager);
    recipientWallet = buildRecipientWallet(factoryBuilder);

    walletRepository.index(senderWallet);
    walletRepository.index(secondSignatureWallet);
    walletRepository.index(multiSignatureWallet);
    walletRepository.index(recipientWallet);
});

afterEach(() => {
    Mocks.TransactionRepository.setTransactions([]);
});

describe("MultiPaymentTransaction", () => {
    let multiPaymentTransaction: Interfaces.ITransaction;
    let secondSignatureMultiPaymentTransaction: Interfaces.ITransaction;
    let multiSignatureMultiPaymentTransaction: Interfaces.ITransaction;
    let handler: TransactionHandler;

    beforeEach(async () => {
        const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(
            Identifiers.TransactionHandlerRegistry,
        );
        handler = transactionHandlerRegistry.getRegisteredHandlerByType(
            Transactions.InternalTransactionType.from(
                Enums.TransactionType.MultiPayment,
                Enums.TransactionTypeGroup.Core,
            ),
            2,
        );

        multiPaymentTransaction = crypto.TransactionManager.BuilderFactory.multiPayment()
            .addPayment("ARYJmeYHSUTgbxaiqsgoPwf6M3CYukqdKN", "10")
            .addPayment("AFyjB5jULQiYNsp37wwipCm9c7V1xEzTJD", "20")
            .addPayment("AJwD3UJM7UESFnP1fsKYr4EX9Gc1EJNSqm", "30")
            .addPayment("AUsi9ZcFkcwG7WMpRE121TR4HaTjnAP7qD", "40")
            .addPayment("ARugw4i18i2pVnYZEMWKJj2mAnQQ97wuat", "50")
            .nonce("1")
            .sign(passphrases[0])
            .build();

        secondSignatureMultiPaymentTransaction = crypto.TransactionManager.BuilderFactory.multiPayment()
            .addPayment("ARYJmeYHSUTgbxaiqsgoPwf6M3CYukqdKN", "10")
            .addPayment("AFyjB5jULQiYNsp37wwipCm9c7V1xEzTJD", "20")
            .addPayment("AJwD3UJM7UESFnP1fsKYr4EX9Gc1EJNSqm", "30")
            .addPayment("AUsi9ZcFkcwG7WMpRE121TR4HaTjnAP7qD", "40")
            .addPayment("ARugw4i18i2pVnYZEMWKJj2mAnQQ97wuat", "50")
            .nonce("1")
            .sign(passphrases[1])
            .secondSign(passphrases[2])
            .build();

        multiSignatureMultiPaymentTransaction = crypto.TransactionManager.BuilderFactory.multiPayment()
            .addPayment("ARYJmeYHSUTgbxaiqsgoPwf6M3CYukqdKN", "10")
            .addPayment("AFyjB5jULQiYNsp37wwipCm9c7V1xEzTJD", "20")
            .addPayment("AJwD3UJM7UESFnP1fsKYr4EX9Gc1EJNSqm", "30")
            .addPayment("AUsi9ZcFkcwG7WMpRE121TR4HaTjnAP7qD", "40")
            .addPayment("ARugw4i18i2pVnYZEMWKJj2mAnQQ97wuat", "50")
            .nonce("1")
            .senderPublicKey(multiSignatureWallet.publicKey!)
            .multiSign(passphrases[0], 0)
            .multiSign(passphrases[1], 1)
            .multiSign(passphrases[2], 2)
            .build();
    });

    describe("bootstrap", () => {
        it("should resolve", async () => {
            Mocks.TransactionRepository.setTransactions([Mapper.mapTransactionToModel(multiPaymentTransaction)]);
            await expect(handler.bootstrap()).toResolve();
        });
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", async () => {
            await expect(
                handler.throwIfCannotBeApplied(multiPaymentTransaction, senderWallet, walletRepository),
            ).toResolve();
        });

        it("should not throw - second sign", async () => {
            await expect(
                handler.throwIfCannotBeApplied(
                    secondSignatureMultiPaymentTransaction,
                    secondSignatureWallet,
                    walletRepository,
                ),
            ).toResolve();
        });

        it("should not throw - multi sign", async () => {
            await expect(
                handler.throwIfCannotBeApplied(
                    multiSignatureMultiPaymentTransaction,
                    multiSignatureWallet,
                    walletRepository,
                ),
            ).toResolve();
        });

        it("should throw if wallet has insufficient funds", async () => {
            senderWallet.balance = crypto.CryptoManager.LibraryManager.Libraries.BigNumber.ZERO;
            await expect(
                handler.throwIfCannotBeApplied(multiPaymentTransaction, senderWallet, walletRepository),
            ).rejects.toThrow(InsufficientBalanceError);
        });

        it("should throw if wallet has insufficient funds send all payouts", async () => {
            senderWallet.balance = crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make(150); // short by the fee
            await expect(
                handler.throwIfCannotBeApplied(multiPaymentTransaction, senderWallet, walletRepository),
            ).rejects.toThrow(InsufficientBalanceError);
        });
    });

    describe("apply", () => {
        it("should be ok", async () => {
            const senderBalance = senderWallet.balance;
            const totalPaymentsAmount = multiPaymentTransaction.data.asset!.payments!.reduce(
                (prev, curr) => prev.plus(curr.amount),
                crypto.CryptoManager.LibraryManager.Libraries.BigNumber.ZERO,
            );

            await handler.apply(multiPaymentTransaction, walletRepository);

            expect(senderWallet.balance).toEqual(
                crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make(senderBalance)
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
            senderWallet.nonce = crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make(1);

            for (const { recipientId, amount } of multiPaymentTransaction.data.asset!.payments!) {
                const paymentRecipientWallet = walletRepository.findByAddress(recipientId);
                paymentRecipientWallet.balance = amount;
            }
            const totalPaymentsAmount = multiPaymentTransaction.data.asset!.payments!.reduce(
                (prev, curr) => prev.plus(curr.amount),
                crypto.CryptoManager.LibraryManager.Libraries.BigNumber.ZERO,
            );

            await handler.revert(multiPaymentTransaction, walletRepository);
            expect(senderWallet.balance).toEqual(
                crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make(senderBalance)
                    .plus(totalPaymentsAmount)
                    .plus(multiPaymentTransaction.data.fee),
            );

            expect(senderWallet.nonce.isZero()).toBeTrue();
            expect(recipientWallet.balance).toEqual(crypto.CryptoManager.LibraryManager.Libraries.BigNumber.ZERO);
        });
    });
});
