import "jest-extended";

import { Application, Contracts, Exceptions } from "@packages/core-kernel";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { Wallets } from "@packages/core-state";
import { StateStore } from "@packages/core-state/src/stores/state";
import { Generators } from "@packages/core-test-framework/src";
import { Factories, FactoryBuilder } from "@packages/core-test-framework/src/factories";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import { Mempool } from "@packages/core-transaction-pool/src/mempool";
import {
    InsufficientBalanceError,
    NotSupportedForMultiSignatureWalletError,
    SecondSignatureAlreadyRegisteredError,
} from "@packages/core-transactions/src/errors";
import { TransactionHandler } from "@packages/core-transactions/src/handlers";
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

describe("SecondSignatureRegistrationTransaction", () => {
    let secondSignatureTransaction: Interfaces.ITransaction;
    let handler: TransactionHandler;

    beforeEach(async () => {
        const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(
            Identifiers.TransactionHandlerRegistry,
        );
        handler = transactionHandlerRegistry.getRegisteredHandlerByType(
            Transactions.InternalTransactionType.from(
                Enums.TransactionType.SecondSignature,
                Enums.TransactionTypeGroup.Core,
            ),
            2,
        );

        secondSignatureTransaction = BuilderFactory.secondSignature()
            .nonce("1")
            .signatureAsset(passphrases[1])
            .sign(passphrases[0])
            .build();
    });

    describe("bootstrap", () => {
        it("should resolve", async () => {
            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield secondSignatureTransaction.data;
            });

            await expect(handler.bootstrap()).toResolve();

            expect(transactionHistoryService.streamByCriteria).toBeCalledWith({
                typeGroup: Enums.TransactionTypeGroup.Core,
                type: Enums.TransactionType.SecondSignature,
            });
        });

        it("should throw if asset is undefined", async () => {
            secondSignatureTransaction.data.asset = undefined;

            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield secondSignatureTransaction.data;
            });

            await expect(handler.bootstrap()).rejects.toThrow(Exceptions.Runtime.AssertionException);
        });

        it("should throw if asset.signature is undefined", async () => {
            secondSignatureTransaction.data.asset!.signature = undefined;

            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield secondSignatureTransaction.data;
            });

            await expect(handler.bootstrap()).rejects.toThrow(Exceptions.Runtime.AssertionException);
        });
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotBeApplied(secondSignatureTransaction, senderWallet)).toResolve();
        });

        it("should throw if wallet already has a second signature", async () => {
            senderWallet.setAttribute(
                "secondPublicKey",
                "02def27da9336e7fbf63131b8d7e5c9f45b296235db035f1f4242c507398f0f21d",
            );

            await expect(handler.throwIfCannotBeApplied(secondSignatureTransaction, senderWallet)).rejects.toThrow(
                SecondSignatureAlreadyRegisteredError,
            );
        });

        it("should throw if wallet already has a multi signature", async () => {
            const multiSignatureAsset: IMultiSignatureAsset = {
                min: 2,
                publicKeys: [
                    Identities.PublicKey.fromPassphrase(passphrases[21]),
                    Identities.PublicKey.fromPassphrase(passphrases[22]),
                    Identities.PublicKey.fromPassphrase(passphrases[23]),
                ],
            };

            senderWallet.setAttribute("multiSignature", multiSignatureAsset);

            await expect(handler.throwIfCannotBeApplied(secondSignatureTransaction, senderWallet)).rejects.toThrow(
                NotSupportedForMultiSignatureWalletError,
            );
        });

        it("should throw if wallet has insufficient funds", async () => {
            senderWallet.setBalance(Utils.BigNumber.ZERO);

            await expect(handler.throwIfCannotBeApplied(secondSignatureTransaction, senderWallet)).rejects.toThrow(
                InsufficientBalanceError,
            );
        });

        it("should throw if asset.signature.publicKey is undefined", async () => {
            // @ts-ignore
            secondSignatureTransaction.data.asset.signature.publicKey = undefined;

            await expect(handler.throwIfCannotBeApplied(secondSignatureTransaction, senderWallet)).rejects.toThrow(
                Exceptions.Runtime.AssertionException,
            );
        });

        it("should throw if asset.signature is undefined", async () => {
            secondSignatureTransaction.data.asset!.signature = undefined;

            await expect(handler.throwIfCannotBeApplied(secondSignatureTransaction, senderWallet)).rejects.toThrow(
                Exceptions.Runtime.AssertionException,
            );
        });

        it("should throw if asset is undefined", async () => {
            secondSignatureTransaction.data.asset = undefined;

            await expect(handler.throwIfCannotBeApplied(secondSignatureTransaction, senderWallet)).rejects.toThrow(
                Exceptions.Runtime.AssertionException,
            );
        });
    });

    describe("throwIfCannotEnterPool", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotEnterPool(secondSignatureTransaction)).toResolve();
        });

        it("should throw if transaction by sender already in pool", async () => {
            await app.get<Mempool>(Identifiers.TransactionPoolMempool).addTransaction(secondSignatureTransaction);

            await expect(handler.throwIfCannotEnterPool(secondSignatureTransaction)).rejects.toThrow(
                Contracts.TransactionPool.PoolError,
            );
        });
    });

    describe("apply", () => {
        it("should not throw with second signature registration", async () => {
            await expect(handler.throwIfCannotBeApplied(secondSignatureTransaction, senderWallet)).toResolve();

            await handler.apply(secondSignatureTransaction);
            expect(senderWallet.getAttribute("secondPublicKey")).toBe(
                "02def27da9336e7fbf63131b8d7e5c9f45b296235db035f1f4242c507398f0f21d",
            );
        });

        it("should be invalid to apply a second signature registration twice", async () => {
            await expect(handler.throwIfCannotBeApplied(secondSignatureTransaction, senderWallet)).toResolve();

            await handler.apply(secondSignatureTransaction);
            expect(senderWallet.getAttribute("secondPublicKey")).toBe(
                "02def27da9336e7fbf63131b8d7e5c9f45b296235db035f1f4242c507398f0f21d",
            );

            await expect(handler.throwIfCannotBeApplied(secondSignatureTransaction, senderWallet)).rejects.toThrow(
                SecondSignatureAlreadyRegisteredError,
            );
        });
    });

    describe("applyToSender", () => {
        it("should throw if asset.signature.publicKey is undefined", async () => {
            // @ts-ignore
            secondSignatureTransaction.data.asset.signature.publicKey = undefined;

            handler.throwIfCannotBeApplied = jest.fn();

            await expect(handler.apply(secondSignatureTransaction)).rejects.toThrow(
                Exceptions.Runtime.AssertionException,
            );
        });

        it("should throw if asset.signature is undefined", async () => {
            secondSignatureTransaction.data.asset!.signature = undefined;

            handler.throwIfCannotBeApplied = jest.fn();

            await expect(handler.apply(secondSignatureTransaction)).rejects.toThrow(
                Exceptions.Runtime.AssertionException,
            );
        });

        it("should throw if asset is undefined", async () => {
            secondSignatureTransaction.data.asset = undefined;

            handler.throwIfCannotBeApplied = jest.fn();

            await expect(handler.apply(secondSignatureTransaction)).rejects.toThrow(
                Exceptions.Runtime.AssertionException,
            );
        });
    });

    describe("revert", () => {
        it("should be ok", async () => {
            expect(senderWallet.hasAttribute("secondPublicKey")).toBe(false);
            await expect(handler.throwIfCannotBeApplied(secondSignatureTransaction, senderWallet)).toResolve();

            await handler.apply(secondSignatureTransaction);
            expect(senderWallet.hasAttribute("secondPublicKey")).toBe(true);
            expect(senderWallet.getAttribute("secondPublicKey")).toBe(
                "02def27da9336e7fbf63131b8d7e5c9f45b296235db035f1f4242c507398f0f21d",
            );

            await handler.revert(secondSignatureTransaction);
            expect(senderWallet.hasAttribute("secondPublicKey")).toBe(false);
        });
    });
});
