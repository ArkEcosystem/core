import "jest-extended";

import { Application, Contracts } from "@packages/core-kernel";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { Wallets } from "@packages/core-state";
import { StateStore } from "@packages/core-state/src/stores/state";
import { Generators } from "@packages/core-test-framework/src";
import { Factories, FactoryBuilder } from "@packages/core-test-framework/src/factories";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import { InsufficientBalanceError } from "@packages/core-transactions/src/errors";
import { TransactionHandler } from "@packages/core-transactions/src/handlers";
import { TransactionHandlerRegistry } from "@packages/core-transactions/src/handlers/handler-registry";
import { Crypto, Enums, Interfaces, Managers, Transactions, Utils } from "@packages/crypto";
import { BuilderFactory } from "@packages/crypto/src/transactions";
import { configManager } from "@packages/crypto/src/managers";
import {
    buildMultiSignatureWallet,
    buildRecipientWallet,
    buildSecondSignatureWallet,
    buildSenderWallet,
    initApp,
} from "../__support__/app";
import { Mocks, Mapper } from "@packages/core-test-framework";

let app: Application;
let senderWallet: Wallets.Wallet;
let secondSignatureWallet: Wallets.Wallet;
let multiSignatureWallet: Wallets.Wallet;
let recipientWallet: Wallets.Wallet;
let walletRepository: Contracts.State.WalletRepository;
let factoryBuilder: FactoryBuilder;

const mockLastBlockData: Partial<Interfaces.IBlockData> = { timestamp: Crypto.Slots.getTime(), height: 4 };

const mockGetLastBlock = jest.fn();
StateStore.prototype.getLastBlock = mockGetLastBlock;
mockGetLastBlock.mockReturnValue({ data: mockLastBlockData });

beforeEach(() => {
    const config = Generators.generateCryptoConfigRaw();
    configManager.setConfig(config);
    Managers.configManager.setConfig(config);

    app = initApp();

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    factoryBuilder = new FactoryBuilder();
    Factories.registerWalletFactory(factoryBuilder);
    Factories.registerTransactionFactory(factoryBuilder);

    senderWallet = buildSenderWallet(factoryBuilder);
    secondSignatureWallet = buildSecondSignatureWallet(factoryBuilder);
    multiSignatureWallet = buildMultiSignatureWallet();
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

        multiPaymentTransaction = BuilderFactory.multiPayment()
            .addPayment("ARYJmeYHSUTgbxaiqsgoPwf6M3CYukqdKN", "10")
            .addPayment("AFyjB5jULQiYNsp37wwipCm9c7V1xEzTJD", "20")
            .addPayment("AJwD3UJM7UESFnP1fsKYr4EX9Gc1EJNSqm", "30")
            .addPayment("AUsi9ZcFkcwG7WMpRE121TR4HaTjnAP7qD", "40")
            .addPayment("ARugw4i18i2pVnYZEMWKJj2mAnQQ97wuat", "50")
            .nonce("1")
            .sign(passphrases[0])
            .build();

        secondSignatureMultiPaymentTransaction = BuilderFactory.multiPayment()
            .addPayment("ARYJmeYHSUTgbxaiqsgoPwf6M3CYukqdKN", "10")
            .addPayment("AFyjB5jULQiYNsp37wwipCm9c7V1xEzTJD", "20")
            .addPayment("AJwD3UJM7UESFnP1fsKYr4EX9Gc1EJNSqm", "30")
            .addPayment("AUsi9ZcFkcwG7WMpRE121TR4HaTjnAP7qD", "40")
            .addPayment("ARugw4i18i2pVnYZEMWKJj2mAnQQ97wuat", "50")
            .nonce("1")
            .sign(passphrases[1])
            .secondSign(passphrases[2])
            .build();

        multiSignatureMultiPaymentTransaction = BuilderFactory.multiPayment()
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
            Mocks.TransactionRepository.setTransactions([
                Mapper.mapTransactionToModel(multiPaymentTransaction),
            ]);
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
            senderWallet.balance = Utils.BigNumber.ZERO;
            await expect(
                handler.throwIfCannotBeApplied(multiPaymentTransaction, senderWallet, walletRepository),
            ).rejects.toThrow(InsufficientBalanceError);
        });

        it("should throw if wallet has insufficient funds send all payouts", async () => {
            senderWallet.balance = Utils.BigNumber.make(150); // short by the fee
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
                Utils.BigNumber.ZERO,
            );

            await handler.apply(multiPaymentTransaction, walletRepository);

            expect(senderWallet.balance).toEqual(
                Utils.BigNumber.make(senderBalance).minus(totalPaymentsAmount).minus(multiPaymentTransaction.data.fee),
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
                Utils.BigNumber.make(senderBalance).plus(totalPaymentsAmount).plus(multiPaymentTransaction.data.fee),
            );

            expect(senderWallet.nonce.isZero()).toBeTrue();
            expect(recipientWallet.balance).toEqual(Utils.BigNumber.ZERO);
        });
    });
});
