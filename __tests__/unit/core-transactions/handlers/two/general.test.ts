import "jest-extended";

import passphrases from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { BuilderFactory } from "@arkecosystem/crypto/src/transactions";
import { Application, Contracts } from "@arkecosystem/core-kernel";
import { Crypto, Enums, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { Factories, FactoryBuilder } from "@arkecosystem/core-test-framework/src/factories";
import { Generators } from "@arkecosystem/core-test-framework/src";
import { Identifiers } from "@arkecosystem/core-kernel/src/ioc";
import { TransactionHandler } from "@arkecosystem/core-transactions/src/handlers";
import { StateStore } from "@arkecosystem/core-state/src/stores/state";
import { TransactionHandlerRegistry } from "@arkecosystem/core-transactions/src/handlers/handler-registry";
import { Wallets } from "@arkecosystem/core-state";
import { configManager } from "@packages/crypto/src/managers";
import {
    InsufficientBalanceError,
    InvalidSecondSignatureError,
    SenderWalletMismatchError,
    UnexpectedSecondSignatureError,
} from "@arkecosystem/core-transactions/src/errors";
import { setMockTransaction } from "../__mocks__/transaction-repository";
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

const mockLastBlockData: Partial<Interfaces.IBlockData> = { timestamp: Crypto.Slots.getTime() , height: 4 };

const mockGetLastBlock = jest.fn();
StateStore.prototype.getLastBlock = mockGetLastBlock;
mockGetLastBlock.mockReturnValue( { data: mockLastBlockData } );

beforeEach(() => {
    const config = Generators.generateCryptoConfigRaw();
    configManager.setConfig(config);
    Managers.configManager.setConfig(config);

    setMockTransaction(null);

    app = initApp();

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    factoryBuilder = new FactoryBuilder();
    Factories.registerWalletFactory(factoryBuilder);
    Factories.registerTransactionFactory(factoryBuilder);

    senderWallet = buildSenderWallet(factoryBuilder);
    secondSignatureWallet = buildSecondSignatureWallet(factoryBuilder);
    multiSignatureWallet = buildMultiSignatureWallet();
    recipientWallet = buildRecipientWallet(factoryBuilder);

    walletRepository.reindex(senderWallet);
    walletRepository.reindex(secondSignatureWallet);
    walletRepository.reindex(multiSignatureWallet);
    walletRepository.reindex(recipientWallet);
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
            .sign(passphrases[0])
            .nonce("1")
            .build();

        transactionWithSecondSignature = BuilderFactory.transfer()
            .recipientId(recipientWallet.address)
            .amount("10000000")
            .sign(passphrases[0])
            .secondSign(passphrases[1])
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
