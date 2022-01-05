import "jest-extended";

import { TransactionTypeGroup } from "@arkecosystem/crypto/dist/enums";
import { TransactionSchema } from "@arkecosystem/crypto/dist/transactions/types/schemas";
import { Application, Contracts } from "@packages/core-kernel";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { Wallets } from "@packages/core-state";
import { StateStore } from "@packages/core-state/src/stores/state";
import { Generators } from "@packages/core-test-framework/src";
import { Factories, FactoryBuilder } from "@packages/core-test-framework/src/factories";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import {
    InsufficientBalanceError,
    InvalidMultiSignaturesError,
    InvalidSecondSignatureError,
    LegacyMultiSignatureError,
    MissingMultiSignatureOnSenderError,
    SenderWalletMismatchError,
    UnexpectedNonceError,
    UnexpectedSecondSignatureError,
    UnsupportedMultiSignatureTransactionError,
} from "@packages/core-transactions/src/errors";
import { TransactionHandler, TransactionHandlerConstructor } from "@packages/core-transactions/src/handlers";
import { TransactionHandlerRegistry } from "@packages/core-transactions/src/handlers/handler-registry";
import { Crypto, Enums, Identities, Interfaces, Managers, Transactions, Utils } from "@packages/crypto";
import { BuilderFactory } from "@packages/crypto/dist/transactions";
import { IMultiSignatureAsset } from "@packages/crypto/src/interfaces";
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

class TestTransaction extends Transactions.Transaction {
    public static typeGroup: number = TransactionTypeGroup.Test;
    public static type: number = 1;
    public static key = "test";
    public static version: number = 2;

    public static getSchema(): TransactionSchema {
        return {
            $id: "test",
        };
    }

    public serialize(options?: any): Utils.ByteBuffer | undefined {
        return new Utils.ByteBuffer(Buffer.alloc(0));
    }

    public deserialize(buf) {
        return;
    }
}

class TestTransactionHandler extends TransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return TestTransaction;
    }

    public dependencies(): ReadonlyArray<TransactionHandlerConstructor> {
        return [];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return [];
    }

    public async isActivated(): Promise<boolean> {
        return true;
    }

    public async bootstrap(): Promise<void> {}

    public async applyToRecipient(transaction: Interfaces.ITransaction): Promise<void> {}

    public async revertForRecipient(transaction: Interfaces.ITransaction): Promise<void> {}
}

// Transactions.TransactionRegistry.registerTransactionType(TestTransaction);

beforeEach(() => {
    const config = Generators.generateCryptoConfigRaw();
    configManager.setConfig(config);
    Managers.configManager.setConfig(config);

    app = initApp();

    app.bind(Identifiers.TransactionHandler).to(TestTransactionHandler);

    app.bind(Identifiers.TransactionHistoryService).toConstantValue(null);

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
    try {
        Transactions.TransactionRegistry.deregisterTransactionType(TestTransaction);
    } catch {}
});

describe("General Tests", () => {
    let transferTransaction: Interfaces.ITransaction;
    let transactionWithSecondSignature: Interfaces.ITransaction;
    let multiSignatureTransferTransaction: Interfaces.ITransaction;
    let handler: TestTransactionHandler;

    beforeEach(async () => {
        const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(
            Identifiers.TransactionHandlerRegistry,
        );
        handler = transactionHandlerRegistry.getRegisteredHandlerByType(
            Transactions.InternalTransactionType.from(1, Enums.TransactionTypeGroup.Test),
            2,
        );

        transferTransaction = BuilderFactory.transfer()
            .recipientId(recipientWallet.getAddress())
            .amount("10000000")
            .nonce("1")
            .sign(passphrases[0])
            .build();

        transactionWithSecondSignature = BuilderFactory.transfer()
            .recipientId(recipientWallet.getAddress())
            .amount("10000000")
            .nonce("1")
            .sign(passphrases[0])
            .secondSign(passphrases[1])
            .build();

        multiSignatureTransferTransaction = BuilderFactory.transfer()
            .senderPublicKey(multiSignatureWallet.getPublicKey()!)
            .recipientId(recipientWallet.getAddress())
            .amount("1")
            .nonce("1")
            .multiSign(passphrases[0], 0)
            .multiSign(passphrases[1], 1)
            .multiSign(passphrases[2], 2)
            .build();
    });

    describe("verify", () => {
        it("should be verified", async () => {
            await expect(handler.verify(transferTransaction)).resolves.toBeTrue();
        });

        it("should be verified with multi sign", async () => {
            await expect(handler.verify(multiSignatureTransferTransaction)).resolves.toBeTrue();
        });
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotBeApplied(transferTransaction, senderWallet)).toResolve();
        });

        it("should not throw if version is undefined", async () => {
            transferTransaction.data.version = undefined;
            await expect(handler.throwIfCannotBeApplied(transferTransaction, senderWallet)).toResolve();
        });

        it("should throw if wallet publicKey does not match transaction senderPublicKey", async () => {
            transferTransaction.data.senderPublicKey = "a".repeat(66);
            await expect(handler.throwIfCannotBeApplied(transferTransaction, senderWallet)).rejects.toThrowError(
                SenderWalletMismatchError,
            );
        });

        it("should not throw if the transaction has a second signature and should ignore second signaure field", async () => {
            Managers.configManager.getMilestone().ignoreInvalidSecondSignatureField = true;
            // @ts-ignore
            Managers.configManager.config.network.name = "devnet";

            await expect(handler.throwIfCannotBeApplied(transactionWithSecondSignature, senderWallet)).toResolve();

            // @ts-ignore
            Managers.configManager.config.network.name = "testnet";
            Managers.configManager.getMilestone().ignoreInvalidSecondSignatureField = false;
        });

        it("should throw if the transaction has a second signature but wallet does not", async () => {
            await expect(
                handler.throwIfCannotBeApplied(transactionWithSecondSignature, senderWallet),
            ).rejects.toThrowError(UnexpectedSecondSignatureError);
        });

        it("should throw if the sender has a second signature, but stored walled has not", async () => {
            const secondSigWallet = buildSenderWallet(factoryBuilder);
            secondSigWallet.setAttribute(
                "secondPublicKey",
                "038082dad560a22ea003022015e3136b21ef1ffd9f2fd50049026cbe8e2258ca17",
            );
            await expect(handler.throwIfCannotBeApplied(transferTransaction, secondSigWallet)).rejects.toThrowError(
                UnexpectedSecondSignatureError,
            );
        });

        it("should throw if nonce is invalid", async () => {
            senderWallet.setNonce(Utils.BigNumber.make(1));
            await expect(handler.throwIfCannotBeApplied(transferTransaction, senderWallet)).rejects.toThrowError(
                UnexpectedNonceError,
            );
        });

        it("should not throw if transaction nonce is undefined", async () => {
            transferTransaction.data.nonce = undefined;

            await expect(handler.throwIfCannotBeApplied(transferTransaction, senderWallet)).rejects.toThrowError(
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
                legacy: true,
            };

            senderWallet.setAttribute("multiSignature", multiSignatureAsset);
            await expect(handler.throwIfCannotBeApplied(transferTransaction, senderWallet)).rejects.toThrowError(
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
                min: 2,
            };

            const multiSigWallet = buildSenderWallet(factoryBuilder);
            multiSigWallet.setAttribute("multiSignature", multiSignatureAsset);
            await expect(handler.throwIfCannotBeApplied(transferTransaction, multiSigWallet)).rejects.toThrowError(
                MissingMultiSignatureOnSenderError,
            );
        });

        it("should throw if sender and transaction multi signatures does not match", async () => {
            const multiSignatureAsset: IMultiSignatureAsset = {
                publicKeys: [
                    Identities.PublicKey.fromPassphrase(passphrases[1]),
                    Identities.PublicKey.fromPassphrase(passphrases[0]),
                    Identities.PublicKey.fromPassphrase(passphrases[2]),
                ],
                min: 2,
            };

            multiSignatureWallet.setAttribute("multiSignature", multiSignatureAsset);
            await expect(
                handler.throwIfCannotBeApplied(multiSignatureTransferTransaction, multiSignatureWallet),
            ).rejects.toThrowError(InvalidMultiSignaturesError);
        });

        it("should throw if transaction has signatures and it is not multi signature registration", async () => {
            transferTransaction.data.signatures = [
                "009fe6ca3b83a9a5e693fecb2b184900c5135a8c07e704c473b2f19117630f840428416f583f1a24ff371ba7e6fbca9a7fb796226ef9ef6542f44ed911951ac88d",
                "0116779a98b2009b35d4003dda7628e46365f1a52068489bfbd80594770967a3949f76bc09e204eddd7d460e1e519b826c53dc6e2c9573096326dbc495050cf292",
                "02687bd0f4a91be39daf648a5b1e1af5ffa4a3d4319b2e38b1fc2dc206db03f542f3b26c4803e0b4c8a53ddfb6cf4533b512d71ae869d4e4ccba989c4a4222396b",
            ];
            await expect(handler.throwIfCannotBeApplied(transferTransaction, senderWallet)).rejects.toThrowError(
                UnsupportedMultiSignatureTransactionError,
            );
        });

        it("should throw if wallet and transaction second signatures does not match", async () => {
            senderWallet.setAttribute("secondPublicKey", "invalid-public-key");
            await expect(handler.throwIfCannotBeApplied(transactionWithSecondSignature, senderWallet)).rejects.toThrow(
                InvalidSecondSignatureError,
            );
        });

        it("should throw if wallet has not enough balance", async () => {
            // 1 arktoshi short
            senderWallet.setBalance(transferTransaction.data.amount.plus(transferTransaction.data.fee).minus(1));
            await expect(handler.throwIfCannotBeApplied(transferTransaction, senderWallet)).rejects.toThrow(
                InsufficientBalanceError,
            );
        });

        it("should be true even with publicKey case mismatch", async () => {
            transferTransaction.data.senderPublicKey = transferTransaction.data.senderPublicKey!.toUpperCase();
            senderWallet.setPublicKey(senderWallet.getPublicKey()!.toLowerCase());

            const instance: Interfaces.ITransaction = Transactions.TransactionFactory.fromData(
                transferTransaction.data,
            );
            await expect(handler.throwIfCannotBeApplied(instance, senderWallet)).toResolve();
        });
    });

    describe("dynamicFees", () => {
        beforeEach(async () => {
            const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(
                Identifiers.TransactionHandlerRegistry,
            );
            handler = transactionHandlerRegistry.getRegisteredHandlerByType(
                Transactions.InternalTransactionType.from(
                    Enums.TransactionType.Transfer,
                    Enums.TransactionTypeGroup.Core,
                ),
                2,
            );

            transferTransaction = BuilderFactory.transfer()
                .amount("10000000")
                .recipientId(recipientWallet.getAddress())
                .sign("secret")
                .nonce("0")
                .build();

            Managers.configManager.getMilestone().aip11 = true;
        });

        it("should correctly calculate the transaction fee based on transaction size and addonBytes", async () => {
            const addonBytes = 137;

            expect(
                handler.dynamicFee({ transaction: transferTransaction, addonBytes, satoshiPerByte: 3, height: 1 }),
            ).toEqual(Utils.BigNumber.make(137 + transferTransaction.serialized.length / 2).times(3));

            expect(
                handler.dynamicFee({ transaction: transferTransaction, addonBytes, satoshiPerByte: 6, height: 1 }),
            ).toEqual(Utils.BigNumber.make(137 + transferTransaction.serialized.length / 2).times(6));

            expect(
                handler.dynamicFee({ transaction: transferTransaction, addonBytes: 0, satoshiPerByte: 9, height: 1 }),
            ).toEqual(Utils.BigNumber.make(transferTransaction.serialized.length / 2).times(9));
        });

        it("should default satoshiPerByte to 1 if value provided is <= 0", async () => {
            expect(
                handler.dynamicFee({ transaction: transferTransaction, addonBytes: 0, satoshiPerByte: -50, height: 1 }),
            ).toEqual(
                handler.dynamicFee({ transaction: transferTransaction, addonBytes: 0, satoshiPerByte: 1, height: 1 }),
            );
            expect(
                handler.dynamicFee({ transaction: transferTransaction, addonBytes: 0, satoshiPerByte: 0, height: 1 }),
            ).toEqual(
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
            await expect(handler.apply(transferTransaction)).toResolve();
        });

        it("should not fail due to case mismatch", async () => {
            const transactionData: Interfaces.ITransactionData = transferTransaction.data;
            transactionData.senderPublicKey = transactionData.senderPublicKey?.toUpperCase();
            const instance = Transactions.TransactionFactory.fromData(transactionData);

            const senderBalance = senderWallet.getBalance();

            await handler.apply(instance);

            expect(senderWallet.getBalance()).toEqual(
                Utils.BigNumber.make(senderBalance).minus(instance.data.amount).minus(instance.data.fee),
            );
        });

        it("should resolve with V1", async () => {
            configManager.getMilestone().aip11 = false;

            transferTransaction = BuilderFactory.transfer()
                .recipientId(recipientWallet.getAddress())
                .amount("10000000")
                .nonce("1")
                .sign(passphrases[0])
                .build();

            await expect(handler.apply(transferTransaction)).toResolve();
        });

        it("should throw with negative balance", async () => {
            senderWallet.setBalance(Utils.BigNumber.ZERO);
            await expect(handler.apply(transferTransaction)).rejects.toThrow(InsufficientBalanceError);
        });

        it("should throw with negative balance if environment is not test", async () => {
            process.env.CORE_ENV === "unitest";
            senderWallet.setBalance(Utils.BigNumber.ZERO);
            await expect(handler.apply(transferTransaction)).rejects.toThrow(InsufficientBalanceError);
        });

        it("should resolve defined as exception", async () => {
            configManager.set("exceptions.transactions", [transferTransaction.id]);
            configManager.set("network.pubKeyHash", 99);
            await expect(handler.apply(transferTransaction)).toResolve();
        });
    });

    describe("revert", () => {
        it("should resolve", async () => {
            await expect(handler.apply(transferTransaction)).toResolve();
            await expect(handler.revert(transferTransaction)).toResolve();
        });

        it("should resolve if version is undefined", async () => {
            transferTransaction.data.version = undefined;

            await expect(handler.apply(transferTransaction)).toResolve();
            await expect(handler.revert(transferTransaction)).toResolve();
        });

        it("should throw if nonce is undefined", async () => {
            await expect(handler.apply(transferTransaction)).toResolve();
            transferTransaction.data.nonce = undefined;
            await expect(handler.revert(transferTransaction)).rejects.toThrow(UnexpectedNonceError);
        });

        it("should throw if nonce is invalid", async () => {
            await expect(handler.apply(transferTransaction)).toResolve();
            senderWallet.setNonce(Utils.BigNumber.make(100));
            await expect(handler.revert(transferTransaction)).rejects.toThrow(UnexpectedNonceError);
        });

        it("should not fail due to case mismatch", async () => {
            senderWallet.setNonce(Utils.BigNumber.make(1));

            const transactionData: Interfaces.ITransactionData = transferTransaction.data;
            transactionData.senderPublicKey = transactionData.senderPublicKey?.toUpperCase();
            const instance = Transactions.TransactionFactory.fromData(transactionData);

            const senderBalance = senderWallet.getBalance();

            await handler.revert(instance);
            expect(senderWallet.getBalance()).toEqual(
                Utils.BigNumber.make(senderBalance).plus(instance.data.amount).plus(instance.data.fee),
            );

            expect(senderWallet.getNonce().isZero()).toBeTrue();
        });
    });

    describe("emitEvents", () => {
        it("should be ok", async () => {
            // @ts-ignore
            handler.emitEvents(transferTransaction, {});
        });
    });

    describe("throwIfCannotEnterPool", () => {
        it("should resolve", async () => {
            await expect(handler.throwIfCannotEnterPool(transferTransaction)).toResolve();
        });
    });
});
