import "jest-extended";

import { CryptoSuite, Interfaces as BlockInterfaces } from "@packages/core-crypto/src";
import { Application, Contracts } from "@packages/core-kernel";
import { DelegateEvent } from "@packages/core-kernel/src/enums";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { Wallets } from "@packages/core-state";
import { StateStore } from "@packages/core-state/src/stores/state";
import { Mapper, Mocks } from "@packages/core-test-framework/src";
import { Generators } from "@packages/core-test-framework/src";
import { Factories, FactoryBuilder } from "@packages/core-test-framework/src/factories";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import { Mempool } from "@packages/core-transaction-pool/src/mempool";
import {
    InsufficientBalanceError,
    NotSupportedForMultiSignatureWalletError,
    WalletIsAlreadyDelegateError,
    WalletUsernameAlreadyRegisteredError,
} from "@packages/core-transactions/src/errors";
import { TransactionHandler } from "@packages/core-transactions/src/handlers";
import { TransactionHandlerRegistry } from "@packages/core-transactions/src/handlers/handler-registry";
import { Enums, Interfaces, Transactions } from "@packages/crypto";
import { IMultiSignatureAsset } from "@packages/crypto/src/interfaces";

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
        exceptions: { transactions: ["37b5f11e763bdfce6816bcdc36ed7d7ad7bc3b2a16b1bbd3e7c355fceed3c22a"] },
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

describe("DelegateRegistrationTransaction", () => {
    let delegateRegistrationTransaction: Interfaces.ITransaction;
    let secondSignaturedDelegateRegistrationTransaction: Interfaces.ITransaction;
    let handler: TransactionHandler;

    beforeEach(async () => {
        const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(
            Identifiers.TransactionHandlerRegistry,
        );
        handler = transactionHandlerRegistry.getRegisteredHandlerByType(
            Transactions.InternalTransactionType.from(
                Enums.TransactionType.DelegateRegistration,
                Enums.TransactionTypeGroup.Core,
            ),
            2,
        );

        delegateRegistrationTransaction = crypto.TransactionManager.BuilderFactory.delegateRegistration()
            .usernameAsset("dummy")
            .nonce("1")
            .sign(passphrases[0])
            .build();

        secondSignaturedDelegateRegistrationTransaction = crypto.TransactionManager.BuilderFactory.delegateRegistration()
            .usernameAsset("dummy")
            .nonce("1")
            .sign(passphrases[1])
            .secondSign(passphrases[2])
            .build();
    });

    describe("bootstrap", () => {
        afterEach(() => {
            Mocks.TransactionRepository.setTransactions([]);
            Mocks.BlockRepository.setDelegateForgedBlocks([]);
            Mocks.BlockRepository.setLastForgedBlocks([]);
        });

        it("should resolve", async () => {
            Mocks.TransactionRepository.setTransactions([
                Mapper.mapTransactionToModel(delegateRegistrationTransaction),
            ]);
            await expect(handler.bootstrap()).toResolve();
        });

        it("should resolve with bocks", async () => {
            Mocks.TransactionRepository.setTransactions([
                Mapper.mapTransactionToModel(delegateRegistrationTransaction),
            ]);

            Mocks.BlockRepository.setDelegateForgedBlocks([
                {
                    generatorPublicKey: crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[0]),
                    totalRewards: "2",
                    totalFees: "2",
                    totalProduced: 1,
                },
            ]);

            Mocks.BlockRepository.setLastForgedBlocks([
                {
                    generatorPublicKey: crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[0]),
                    id: "123",
                    height: "1",
                    timestamp: 1,
                },
            ]);

            await expect(handler.bootstrap()).toResolve();
        });

        it("should resolve with bocks and genesis wallet", async () => {
            Mocks.BlockRepository.setDelegateForgedBlocks([
                {
                    generatorPublicKey: crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[0]),
                    totalRewards: "2",
                    totalFees: "2",
                    totalProduced: 1,
                },
            ]);

            Mocks.BlockRepository.setLastForgedBlocks([
                {
                    generatorPublicKey: crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[0]),
                    id: "123",
                    height: "1",
                    timestamp: 1,
                },
            ]);

            await expect(handler.bootstrap()).toResolve();
        });
    });

    describe("emitEvents", () => {
        it("should dispatch", async () => {
            const emitter: Contracts.Kernel.EventDispatcher = app.get<Contracts.Kernel.EventDispatcher>(
                Identifiers.EventDispatcherService,
            );

            const spy = jest.spyOn(emitter, "dispatch");

            handler.emitEvents(delegateRegistrationTransaction, emitter);

            expect(spy).toHaveBeenCalledWith(DelegateEvent.Registered, expect.anything());
        });
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", async () => {
            await expect(
                handler.throwIfCannotBeApplied(delegateRegistrationTransaction, senderWallet, walletRepository),
            ).toResolve();
        });

        it("should not throw - second sign", async () => {
            await expect(
                handler.throwIfCannotBeApplied(
                    secondSignaturedDelegateRegistrationTransaction,
                    secondSignatureWallet,
                    walletRepository,
                ),
            ).toResolve();
        });

        it("should throw if wallet has a multi signature", async () => {
            const multiSignatureAsset: IMultiSignatureAsset = {
                min: 2,
                publicKeys: [
                    crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[21]),
                    crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[22]),
                    crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[23]),
                ],
            };

            senderWallet.setAttribute("multiSignature", multiSignatureAsset);

            await expect(
                handler.throwIfCannotBeApplied(delegateRegistrationTransaction, senderWallet, walletRepository),
            ).rejects.toThrow(NotSupportedForMultiSignatureWalletError);
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

            await expect(
                handler.throwIfCannotBeApplied(delegateRegistrationTransaction, senderWallet, walletRepository),
            ).rejects.toThrow(WalletIsAlreadyDelegateError);
        });

        it("should throw if another wallet already registered a username", async () => {
            const delegateWallet: Wallets.Wallet = factoryBuilder
                .get("Wallet")
                .withOptions({
                    passphrase: "delegate passphrase",
                    nonce: 0,
                })
                .make();

            delegateWallet.setAttribute("delegate", { username: "dummy" });

            walletRepository.index(delegateWallet);

            await expect(
                handler.throwIfCannotBeApplied(delegateRegistrationTransaction, senderWallet, walletRepository),
            ).rejects.toThrow(WalletUsernameAlreadyRegisteredError);
        });

        it("should throw if wallet has insufficient funds", async () => {
            senderWallet.balance = crypto.CryptoManager.LibraryManager.Libraries.BigNumber.ZERO;

            await expect(
                handler.throwIfCannotBeApplied(delegateRegistrationTransaction, senderWallet, walletRepository),
            ).rejects.toThrow(InsufficientBalanceError);
        });
    });

    describe("throwIfCannotEnterPool", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotEnterPool(delegateRegistrationTransaction)).toResolve();
        });

        it("should throw if transaction by sender already in pool", async () => {
            await app.get<Mempool>(Identifiers.TransactionPoolMempool).addTransaction(delegateRegistrationTransaction);

            await expect(handler.throwIfCannotEnterPool(delegateRegistrationTransaction)).rejects.toThrow(
                Contracts.TransactionPool.PoolError,
            );
        });

        it("should throw if transaction with same username already in pool", async () => {
            const anotherWallet: Wallets.Wallet = factoryBuilder
                .get("Wallet")
                .withOptions({
                    passphrase: passphrases[2],
                    nonce: 0,
                })
                .make();

            anotherWallet.balance = crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make(7527654310);

            walletRepository.index(anotherWallet);

            const anotherDelegateRegistrationTransaction = crypto.TransactionManager.BuilderFactory.delegateRegistration()
                .usernameAsset("dummy")
                .nonce("1")
                .sign(passphrases[2])
                .build();

            await app
                .get<Mempool>(Identifiers.TransactionPoolMempool)
                .addTransaction(anotherDelegateRegistrationTransaction);

            await expect(handler.throwIfCannotEnterPool(delegateRegistrationTransaction)).rejects.toThrow(
                Contracts.TransactionPool.PoolError,
            );
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
