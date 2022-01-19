import "jest-extended";

import { Application, Contracts, Exceptions } from "@packages/core-kernel";
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
import { BuilderFactory } from "@packages/crypto/dist/transactions";
import { configManager } from "@packages/crypto/src/managers";

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

const mockLastBlockData: Partial<Interfaces.IBlockData> = { timestamp: Crypto.Slots.getTime(), height: 4 };

const mockGetLastBlock = jest.fn();
StateStore.prototype.getLastBlock = mockGetLastBlock;
mockGetLastBlock.mockReturnValue({ data: mockLastBlockData });

const transactionHistoryService = {
    streamByCriteria: jest.fn(),
};

beforeEach(() => {
    transactionHistoryService.streamByCriteria.mockReset();

    const config = Generators.generateCryptoConfigRaw();
    configManager.setConfig(config);
    Managers.configManager.setConfig(config);

    app = initApp();
    app.bind(Identifiers.TransactionHistoryService).toConstantValue(transactionHistoryService);

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
            .senderPublicKey(multiSignatureWallet.getPublicKey()!)
            .multiSign(passphrases[0], 0)
            .multiSign(passphrases[1], 1)
            .multiSign(passphrases[2], 2)
            .build();
    });

    describe("bootstrap", () => {
        it("should resolve", async () => {
            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield multiPaymentTransaction.data;
            });

            await expect(handler.bootstrap()).toResolve();

            expect(transactionHistoryService.streamByCriteria).toBeCalledWith({
                typeGroup: Enums.TransactionTypeGroup.Core,
                type: Enums.TransactionType.MultiPayment,
            });
        });

        it("should throw if asset is undefined", async () => {
            multiPaymentTransaction.data.asset = undefined;

            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield multiPaymentTransaction.data;
            });

            await expect(handler.bootstrap()).rejects.toThrow(Exceptions.Runtime.AssertionException);
        });
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotBeApplied(multiPaymentTransaction, senderWallet)).toResolve();
        });

        it("should not throw - second sign", async () => {
            await expect(
                handler.throwIfCannotBeApplied(secondSignatureMultiPaymentTransaction, secondSignatureWallet),
            ).toResolve();
        });

        it("should not throw - multi sign", async () => {
            await expect(
                handler.throwIfCannotBeApplied(multiSignatureMultiPaymentTransaction, multiSignatureWallet),
            ).toResolve();
        });

        it("should throw if asset is undefined", async () => {
            multiPaymentTransaction.data.asset = undefined;

            await expect(handler.throwIfCannotBeApplied(multiPaymentTransaction, senderWallet)).rejects.toThrow(
                Exceptions.Runtime.AssertionException,
            );
        });

        it("should throw if wallet has insufficient funds", async () => {
            senderWallet.setBalance(Utils.BigNumber.ZERO);
            await expect(handler.throwIfCannotBeApplied(multiPaymentTransaction, senderWallet)).rejects.toThrow(
                InsufficientBalanceError,
            );
        });

        it("should throw if wallet has insufficient funds send all payouts", async () => {
            senderWallet.setBalance(Utils.BigNumber.make(150)); // short by the fee
            await expect(handler.throwIfCannotBeApplied(multiPaymentTransaction, senderWallet)).rejects.toThrow(
                InsufficientBalanceError,
            );
        });
    });

    describe("apply", () => {
        it("should be ok", async () => {
            const senderBalance = senderWallet.getBalance();
            const totalPaymentsAmount = multiPaymentTransaction.data.asset!.payments!.reduce(
                (prev, curr) => prev.plus(curr.amount),
                Utils.BigNumber.ZERO,
            );

            await handler.apply(multiPaymentTransaction);

            expect(senderWallet.getBalance()).toEqual(
                Utils.BigNumber.make(senderBalance).minus(totalPaymentsAmount).minus(multiPaymentTransaction.data.fee),
            );

            for (const { recipientId, amount } of multiPaymentTransaction.data.asset!.payments!) {
                const paymentRecipientWallet = walletRepository.findByAddress(recipientId);
                expect(paymentRecipientWallet.getBalance()).toEqual(amount);
            }
        });
    });

    describe("applyToSender", () => {
        it("should throw if asset is undefined", async () => {
            multiPaymentTransaction.data.asset = undefined;

            handler.throwIfCannotBeApplied = jest.fn();

            await expect(handler.applyToSender(multiPaymentTransaction)).rejects.toThrow(
                Exceptions.Runtime.AssertionException,
            );
        });
    });

    describe("applyToRecipient", () => {
        it("should throw if asset is undefined", async () => {
            multiPaymentTransaction.data.asset = undefined;

            await expect(handler.applyToRecipient(multiPaymentTransaction)).rejects.toThrow(
                Exceptions.Runtime.AssertionException,
            );
        });
    });

    describe("revert", () => {
        it("should be ok", async () => {
            const senderBalance = senderWallet.getBalance();
            senderWallet.setNonce(Utils.BigNumber.make(1));

            for (const { recipientId, amount } of multiPaymentTransaction.data.asset!.payments!) {
                const paymentRecipientWallet = walletRepository.findByAddress(recipientId);
                paymentRecipientWallet.setBalance(amount);
            }
            const totalPaymentsAmount = multiPaymentTransaction.data.asset!.payments!.reduce(
                (prev, curr) => prev.plus(curr.amount),
                Utils.BigNumber.ZERO,
            );

            await handler.revert(multiPaymentTransaction);
            expect(senderWallet.getBalance()).toEqual(
                Utils.BigNumber.make(senderBalance).plus(totalPaymentsAmount).plus(multiPaymentTransaction.data.fee),
            );

            expect(senderWallet.getNonce().isZero()).toBeTrue();
            expect(recipientWallet.getBalance()).toEqual(Utils.BigNumber.ZERO);
        });
    });

    describe("revertForSender", () => {
        it("should throw if asset is undefined", async () => {
            senderWallet.setNonce(Utils.BigNumber.ONE);

            multiPaymentTransaction.data.asset = undefined;

            await expect(handler.revertForSender(multiPaymentTransaction)).rejects.toThrow(
                Exceptions.Runtime.AssertionException,
            );
        });
    });

    describe("revertForRecipient", () => {
        it("should throw if asset is undefined", async () => {
            multiPaymentTransaction.data.asset = undefined;

            await expect(handler.revertForRecipient(multiPaymentTransaction)).rejects.toThrow(
                Exceptions.Runtime.AssertionException,
            );
        });
    });
});
