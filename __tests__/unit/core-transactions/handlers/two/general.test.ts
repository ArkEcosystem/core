import "jest-extended";

import passphrases from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { BuilderFactory } from "@arkecosystem/crypto/src/transactions";
import { Application, Contracts } from "@arkecosystem/core-kernel";
import { Crypto, Enums, Identities, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { Factories, FactoryBuilder } from "@arkecosystem/core-test-framework/src/factories";
import { Generators } from "@arkecosystem/core-test-framework/src";
import { Identifiers } from "@arkecosystem/core-kernel/src/ioc";
import { TransactionHandler } from "@arkecosystem/core-transactions/src/handlers";
import { StateStore } from "@arkecosystem/core-state/src/stores/state";
import { TransactionHandlerRegistry } from "@arkecosystem/core-transactions/src/handlers/handler-registry";
import { Wallets } from "@arkecosystem/core-state";
import { configManager } from "@packages/crypto/src/managers";
import {
    InsufficientBalanceError, InvalidMultiSignatureError,
    InvalidSecondSignatureError, LegacyMultiSignatureError,
    SenderWalletMismatchError, UnexpectedMultiSignatureError, UnexpectedNonceError,
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
import { IMultiSignatureAsset } from "@arkecosystem/crypto/src/interfaces";

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
    let multiSignatureTransferTransaction: Interfaces.ITransaction;
    let handler: TransactionHandler;

    beforeEach(async () => {
        const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);
        handler = transactionHandlerRegistry.getRegisteredHandlerByType(Transactions.InternalTransactionType.from(Enums.TransactionType.Transfer, Enums.TransactionTypeGroup.Core), 2);

        transferTransaction = BuilderFactory.transfer()
            .recipientId(recipientWallet.address)
            .amount("10000000")
            .nonce("1")
            .sign(passphrases[0])
            .build();

        transactionWithSecondSignature = BuilderFactory.transfer()
            .recipientId(recipientWallet.address)
            .amount("10000000")
            .nonce("1")
            .sign(passphrases[0])
            .secondSign(passphrases[1])
            .build();

        multiSignatureTransferTransaction = BuilderFactory.transfer()
            .senderPublicKey(multiSignatureWallet.publicKey!)
            .recipientId(recipientWallet.address)
            .amount("1")
            .nonce("1")
            .multiSign(passphrases[0], 0)
            .multiSign(passphrases[1], 1)
            .multiSign(passphrases[2], 2)
            .build();
    });

    describe("verify", () => {
        it("should be verified", async () => {
            await expect(handler.verify(transferTransaction, walletRepository)).resolves.toBeTrue();
        });

        it("should be verified with multi sign", async () => {
            await expect(handler.verify(multiSignatureTransferTransaction, walletRepository)).resolves.toBeTrue();
        })
    });

    describe("throwIfCannotBeApplied", () => {

        it("should not throw", async () => {
            await expect(handler.throwIfCannotBeApplied(transferTransaction, senderWallet, walletRepository)).toResolve();
        });

        it("should throw if wallet publicKey does not match transaction senderPublicKey", async () => {
            transferTransaction.data.senderPublicKey = "a".repeat(66);
            await expect(handler.throwIfCannotBeApplied(transferTransaction, senderWallet, walletRepository)).rejects.toThrowError(
                SenderWalletMismatchError,
            );
        });

        it("should throw if the transaction has a second signature but wallet does not", async () => {
            await expect(handler.throwIfCannotBeApplied(transactionWithSecondSignature, senderWallet, walletRepository)).rejects.toThrowError(
                UnexpectedSecondSignatureError,
            );
        });

        it("should throw if the sender has a second signature, but stored walled has not", async () => {
            let secondSigWallet = buildSenderWallet(factoryBuilder);
            secondSigWallet.setAttribute("secondPublicKey",  "038082dad560a22ea003022015e3136b21ef1ffd9f2fd50049026cbe8e2258ca17");
            await expect(handler.throwIfCannotBeApplied(transferTransaction, secondSigWallet, walletRepository)).rejects.toThrowError(
                UnexpectedSecondSignatureError,
            );
        });

        it("should throw if nonce is invalid", async () => {
            senderWallet.nonce = Utils.BigNumber.make(1);
            await expect(handler.throwIfCannotBeApplied(transferTransaction, senderWallet, walletRepository)).rejects.toThrowError(
                UnexpectedNonceError,
            );
        });

        it("should throw if sender has legacy multi signature", async () => {
            const multiSignatureAsset: IMultiSignatureAsset = {
                publicKeys: [
                    Identities.PublicKey.fromPassphrase(passphrases[0]),
                    Identities.PublicKey.fromPassphrase(passphrases[1]),
                    Identities.PublicKey.fromPassphrase(passphrases[2]),
                ],
                min: 2,
                // @ts-ignore
                legacy: true
            };

            senderWallet.setAttribute("multiSignature", multiSignatureAsset);
            await expect(handler.throwIfCannotBeApplied(transferTransaction, senderWallet, walletRepository)).rejects.toThrowError(
                LegacyMultiSignatureError,
            );
        });

        it("should throw if sender has multi signature, but indexed wallet has not", async () => {
            const multiSignatureAsset: IMultiSignatureAsset = {
                publicKeys: [
                    Identities.PublicKey.fromPassphrase(passphrases[0]),
                    Identities.PublicKey.fromPassphrase(passphrases[1]),
                    Identities.PublicKey.fromPassphrase(passphrases[2]),
                ],
                min: 2
            };

            let multiSigWallet = buildSenderWallet(factoryBuilder);
            multiSigWallet.setAttribute("multiSignature", multiSignatureAsset);
            await expect(handler.throwIfCannotBeApplied(transferTransaction, multiSigWallet, walletRepository)).rejects.toThrowError(
                UnexpectedMultiSignatureError,
            );
        });

        it("should throw if sender and transaction multi signatures does not match", async () => {
            const multiSignatureAsset: IMultiSignatureAsset = {
                publicKeys: [
                    Identities.PublicKey.fromPassphrase(passphrases[1]),
                    Identities.PublicKey.fromPassphrase(passphrases[0]),
                    Identities.PublicKey.fromPassphrase(passphrases[2]),
                ],
                min: 2
            };

            multiSignatureWallet.setAttribute("multiSignature", multiSignatureAsset);
            await expect(handler.throwIfCannotBeApplied(multiSignatureTransferTransaction, multiSignatureWallet, walletRepository)).rejects.toThrowError(
                InvalidMultiSignatureError,
            );
        });

        it("should throw if transaction has signatures and it is not multi signature registration", async () => {
            transferTransaction.data.signatures = [
                "009fe6ca3b83a9a5e693fecb2b184900c5135a8c07e704c473b2f19117630f840428416f583f1a24ff371ba7e6fbca9a7fb796226ef9ef6542f44ed911951ac88d",
                "0116779a98b2009b35d4003dda7628e46365f1a52068489bfbd80594770967a3949f76bc09e204eddd7d460e1e519b826c53dc6e2c9573096326dbc495050cf292",
                "02687bd0f4a91be39daf648a5b1e1af5ffa4a3d4319b2e38b1fc2dc206db03f542f3b26c4803e0b4c8a53ddfb6cf4533b512d71ae869d4e4ccba989c4a4222396b",
            ];
            await expect(handler.throwIfCannotBeApplied(transferTransaction, senderWallet, walletRepository)).rejects.toThrowError(
                UnexpectedMultiSignatureError,
            );
        });

        it("should throw if wallet and transaction second signatures does not match", async () => {
            senderWallet.setAttribute("secondPublicKey", "invalid-public-key");
            await expect(handler.throwIfCannotBeApplied(transactionWithSecondSignature, senderWallet, walletRepository)).rejects.toThrow(
                InvalidSecondSignatureError,
            );
        });

        it("should throw if wallet has not enough balance", async () => {
            // 1 arktoshi short
            senderWallet.balance = transferTransaction.data.amount.plus(transferTransaction.data.fee).minus(1);
            await expect(handler.throwIfCannotBeApplied(transferTransaction, senderWallet, walletRepository)).rejects.toThrow(
                InsufficientBalanceError,
            );
        });

        it("should be true even with publicKey case mismatch", async () => {
            transferTransaction.data.senderPublicKey = transferTransaction.data.senderPublicKey!.toUpperCase();
            senderWallet.publicKey = senderWallet.publicKey!.toLowerCase();

            const instance: Interfaces.ITransaction = Transactions.TransactionFactory.fromData(transferTransaction.data);
            await expect(handler.throwIfCannotBeApplied(instance, senderWallet, walletRepository)).toResolve();
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

    describe("apply", () => {
        let pubKeyHash: number;

        beforeEach(() => {
            pubKeyHash = configManager.get("network.pubKeyHash");
        });

        afterEach(() => {
            configManager.set("exceptions.transactions", []);
            configManager.set("network.pubKeyHash", pubKeyHash);
            configManager.getMilestone().aip11 = true;
            process.env.CORE_ENV === "test";
        });

        it("should resolve", async () => {
            await expect(handler.apply(transferTransaction, walletRepository)).toResolve();
        });

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

        it("should resolve defined as exception", async () => {
            configManager.set("exceptions.transactions", [transferTransaction.id]);
            configManager.set("network.pubKeyHash", 99);
            await expect(handler.apply(transferTransaction, walletRepository)).toResolve();
        });

        it("should resolve with V1", async () => {
            configManager.getMilestone().aip11 = false;

            transferTransaction = BuilderFactory.transfer()
                .recipientId(recipientWallet.address)
                .amount("10000000")
                .nonce("1")
                .sign(passphrases[0])
                .build();

            await expect(handler.apply(transferTransaction, walletRepository)).toResolve();
        });

        it("should throw with negative balance", async () => {
            senderWallet.balance = Utils.BigNumber.ZERO;
            await expect(handler.apply(transferTransaction, walletRepository)).rejects.toThrow(InsufficientBalanceError);
        });
    });

    describe("revert", () => {
        it("should resolve", async () => {
            await expect(handler.apply(transferTransaction, walletRepository)).toResolve();
            await expect(handler.revert(transferTransaction, walletRepository)).toResolve();
        });

        it("should throw if nonce is invalid", async () => {
            await expect(handler.apply(transferTransaction, walletRepository)).toResolve();
            senderWallet.nonce = Utils.BigNumber.make(100);
            await expect(handler.revert(transferTransaction, walletRepository)).rejects.toThrow(UnexpectedNonceError);
        });

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
    });
});
