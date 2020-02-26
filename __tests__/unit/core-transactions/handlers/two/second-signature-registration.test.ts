import "jest-extended";

import passphrases from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { BuilderFactory } from "@arkecosystem/crypto/src/transactions";
import { Contracts, Application } from "@arkecosystem/core-kernel";
import { Crypto, Enums, Identities, Interfaces, Managers, Transactions, Utils, } from "@arkecosystem/crypto";
import { FactoryBuilder, Factories } from "@arkecosystem/core-test-framework/src/factories";
import { Generators } from "@arkecosystem/core-test-framework/src";
import { IMultiSignatureAsset } from "@arkecosystem/crypto/src/interfaces";
import { Identifiers } from "@arkecosystem/core-kernel/src/ioc";
import { Memory } from "@arkecosystem/core-transaction-pool";
import { StateStore } from "@arkecosystem/core-state/src/stores/state";
import { TransactionHandler } from "@arkecosystem/core-transactions/src/handlers";
import { TransactionHandlerRegistry } from "@arkecosystem/core-transactions/src/handlers/handler-registry";
import { Wallets } from "@arkecosystem/core-state";
import { configManager } from "@packages/crypto/src/managers";
import {
    InsufficientBalanceError,
    NotSupportedForMultiSignatureWalletError,
    SecondSignatureAlreadyRegisteredError,
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

describe("SecondSignatureRegistrationTransaction", () => {
    let secondSignatureTransaction: Interfaces.ITransaction;
    let handler: TransactionHandler;

    beforeEach(async () => {
        const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);
        handler = transactionHandlerRegistry.getRegisteredHandlerByType(Transactions.InternalTransactionType.from(Enums.TransactionType.SecondSignature, Enums.TransactionTypeGroup.Core), 2);

        secondSignatureTransaction = BuilderFactory.secondSignature()
            .signatureAsset(passphrases[1])
            .sign(passphrases[0])
            .nonce("1")
            .build();
    });

    describe("bootstrap", () => {
        it("should resolve", async () => {
            setMockTransaction(secondSignatureTransaction);
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
                    Identities.PublicKey.fromPassphrase(passphrases[21]),
                    Identities.PublicKey.fromPassphrase(passphrases[22]),
                    Identities.PublicKey.fromPassphrase(passphrases[23]),
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
