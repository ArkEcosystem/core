import "jest-extended";

import { Application, Contracts, Exceptions } from "@packages/core-kernel";
import { DelegateEvent } from "@packages/core-kernel/src/enums";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { Wallets } from "@packages/core-state";
import { StateStore } from "@packages/core-state/src/stores/state";
import { Mocks } from "@packages/core-test-framework";
import { Generators } from "@packages/core-test-framework/src";
import { Factories, FactoryBuilder } from "@packages/core-test-framework/src/factories";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import { Mempool } from "@packages/core-transaction-pool/src/mempool";
import {
    InsufficientBalanceError,
    NotSupportedForMultiSignatureWalletError,
    UnexpectedNonceError,
    WalletIsAlreadyDelegateError,
    WalletUsernameAlreadyRegisteredError,
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

afterEach(() => {
    jest.clearAllMocks();
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

        delegateRegistrationTransaction = BuilderFactory.delegateRegistration()
            .usernameAsset("dummy")
            .nonce("1")
            .sign(passphrases[0])
            .build();

        secondSignaturedDelegateRegistrationTransaction = BuilderFactory.delegateRegistration()
            .usernameAsset("dummy")
            .nonce("1")
            .sign(passphrases[1])
            .secondSign(passphrases[2])
            .build();
    });

    describe("dependencies", () => {
        it("should return empty array", async () => {
            expect(handler.dependencies()).toEqual([]);
        });
    });

    describe("walletAttributes", () => {
        it("should return array", async () => {
            const attributes = handler.walletAttributes();

            expect(attributes).toBeArray();
            expect(attributes.length).toBe(11);
        });
    });

    describe("getConstructor", () => {
        it("should return v2 constructor", async () => {
            expect(handler.getConstructor()).toBe(Transactions.Two.DelegateRegistrationTransaction);
        });
    });

    describe("isActivated", () => {
        it("should return true", async () => {
            await expect(handler.isActivated()).resolves.toBeTrue();
        });
    });

    describe("bootstrap", () => {
        afterEach(() => {
            Mocks.BlockRepository.setDelegateForgedBlocks([]);
            Mocks.BlockRepository.setLastForgedBlocks([]);
        });

        it("should resolve", async () => {
            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield delegateRegistrationTransaction.data;
            });

            expect(senderWallet.hasAttribute("delegate")).toBeFalse();

            await expect(handler.bootstrap()).toResolve();

            expect(transactionHistoryService.streamByCriteria).toBeCalledWith({
                typeGroup: Enums.TransactionTypeGroup.Core,
                type: Enums.TransactionType.DelegateRegistration,
            });
            expect(walletRepository.getIndex(Contracts.State.WalletIndexes.Usernames).has("dummy")).toBeTrue();
            expect(senderWallet.hasAttribute("delegate")).toBeTrue();
            expect(senderWallet.getAttribute("delegate")).toEqual({
                username: "dummy",
                voteBalance: Utils.BigNumber.ZERO,
                forgedFees: Utils.BigNumber.ZERO,
                forgedRewards: Utils.BigNumber.ZERO,
                producedBlocks: 0,
                rank: undefined,
            });
        });

        it("should not resolve if asset.delegate.username is undefined", async () => {
            // @ts-ignore
            delegateRegistrationTransaction.data.asset.delegate.username = undefined;

            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield delegateRegistrationTransaction.data;
            });

            expect(senderWallet.hasAttribute("delegate")).toBeFalse();

            await expect(handler.bootstrap()).rejects.toThrow(Exceptions.Runtime.AssertionException);
            expect(walletRepository.getIndex(Contracts.State.WalletIndexes.Usernames).has("dummy")).toBeFalse();
            expect(senderWallet.hasAttribute("delegate")).toBeFalse();
        });

        it("should not resolve if asset.delegate is undefined", async () => {
            // @ts-ignore
            delegateRegistrationTransaction.data.asset.delegate = undefined;

            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield delegateRegistrationTransaction.data;
            });

            expect(senderWallet.hasAttribute("delegate")).toBeFalse();

            await expect(handler.bootstrap()).rejects.toThrow(Exceptions.Runtime.AssertionException);
            expect(walletRepository.getIndex(Contracts.State.WalletIndexes.Usernames).has("dummy")).toBeFalse();
            expect(senderWallet.hasAttribute("delegate")).toBeFalse();
        });

        it("should not resolve if asset is undefined", async () => {
            delegateRegistrationTransaction.data.asset = undefined;

            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield delegateRegistrationTransaction.data;
            });

            expect(senderWallet.hasAttribute("delegate")).toBeFalse();

            await expect(handler.bootstrap()).rejects.toThrow(Exceptions.Runtime.AssertionException);
            expect(walletRepository.getIndex(Contracts.State.WalletIndexes.Usernames).has("dummy")).toBeFalse();
            expect(senderWallet.hasAttribute("delegate")).toBeFalse();
        });

        it("should resolve with bocks", async () => {
            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield delegateRegistrationTransaction.data;
            });

            Mocks.BlockRepository.setDelegateForgedBlocks([
                {
                    generatorPublicKey: Identities.PublicKey.fromPassphrase(passphrases[0]),
                    totalRewards: "2",
                    totalFees: "2",
                    totalProduced: 1,
                },
            ]);

            const lastForgedBlock = {
                generatorPublicKey: Identities.PublicKey.fromPassphrase(passphrases[0]),
                id: "123",
                height: "1",
                timestamp: 1,
            };

            Mocks.BlockRepository.setLastForgedBlocks([lastForgedBlock]);

            expect(senderWallet.hasAttribute("delegate")).toBeFalse();

            await expect(handler.bootstrap()).toResolve();

            expect(walletRepository.getIndex(Contracts.State.WalletIndexes.Usernames).has("dummy")).toBeTrue();
            expect(senderWallet.hasAttribute("delegate")).toBeTrue();
            expect(senderWallet.getAttribute("delegate.lastBlock")).toEqual(lastForgedBlock);

            const delegateAttributes: any = senderWallet.getAttribute("delegate");
            expect(delegateAttributes.username).toEqual("dummy");
            expect(delegateAttributes.voteBalance).toEqual(Utils.BigNumber.ZERO);
            expect(delegateAttributes.forgedFees).toEqual(Utils.BigNumber.make("2"));
            expect(delegateAttributes.forgedRewards).toEqual(Utils.BigNumber.make("2"));
            expect(delegateAttributes.producedBlocks).toEqual(1);
            expect(delegateAttributes.rank).toBeUndefined();
        });

        it("should resolve with bocks and genesis wallet", async () => {
            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {});

            Mocks.BlockRepository.setDelegateForgedBlocks([
                {
                    generatorPublicKey: Identities.PublicKey.fromPassphrase(passphrases[0]),
                    totalRewards: "2",
                    totalFees: "2",
                    totalProduced: 1,
                },
            ]);

            Mocks.BlockRepository.setLastForgedBlocks([
                {
                    generatorPublicKey: Identities.PublicKey.fromPassphrase(passphrases[0]),
                    id: "123",
                    height: "1",
                    timestamp: 1,
                },
            ]);

            await expect(handler.bootstrap()).toResolve();

            expect(walletRepository.getIndex(Contracts.State.WalletIndexes.Usernames).has("dummy")).toBeFalse();
            expect(senderWallet.hasAttribute("delegate")).toBeFalse();
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
            jest.spyOn(TransactionHandler.prototype, "throwIfCannotBeApplied");

            await expect(handler.throwIfCannotBeApplied(delegateRegistrationTransaction, senderWallet)).toResolve();

            expect(TransactionHandler.prototype.throwIfCannotBeApplied).toHaveBeenCalledTimes(1);
        });

        it("should not throw - second sign", async () => {
            jest.spyOn(TransactionHandler.prototype, "throwIfCannotBeApplied");

            await expect(
                handler.throwIfCannotBeApplied(secondSignaturedDelegateRegistrationTransaction, secondSignatureWallet),
            ).toResolve();

            expect(TransactionHandler.prototype.throwIfCannotBeApplied).toHaveBeenCalledTimes(1);
        });

        it("should throw if wallet has a multi signature", async () => {
            const multiSignatureAsset: IMultiSignatureAsset = {
                min: 2,
                publicKeys: [
                    Identities.PublicKey.fromPassphrase(passphrases[21]),
                    Identities.PublicKey.fromPassphrase(passphrases[22]),
                    Identities.PublicKey.fromPassphrase(passphrases[23]),
                ],
            };

            senderWallet.setAttribute("multiSignature", multiSignatureAsset);

            await expect(handler.throwIfCannotBeApplied(delegateRegistrationTransaction, senderWallet)).rejects.toThrow(
                NotSupportedForMultiSignatureWalletError,
            );
        });

        it("should throw if asset.delegate.username is undefined", async () => {
            // @ts-ignore
            delegateRegistrationTransaction.data.asset.delegate.username = undefined;

            await expect(handler.throwIfCannotBeApplied(delegateRegistrationTransaction, senderWallet)).rejects.toThrow(
                Exceptions.Runtime.AssertionException,
            );
        });

        it("should throw if asset.delegate is undefined", async () => {
            delegateRegistrationTransaction.data.asset!.delegate = undefined;

            await expect(handler.throwIfCannotBeApplied(delegateRegistrationTransaction, senderWallet)).rejects.toThrow(
                Exceptions.Runtime.AssertionException,
            );
        });

        it("should throw if asset is undefined", async () => {
            delegateRegistrationTransaction.data.asset = undefined;

            await expect(handler.throwIfCannotBeApplied(delegateRegistrationTransaction, senderWallet)).rejects.toThrow(
                Exceptions.Runtime.AssertionException,
            );
        });

        it("should throw if wallet is delegate", async () => {
            senderWallet.setAttribute("delegate", { username: "dummy" });
            walletRepository.index(senderWallet);

            await expect(handler.throwIfCannotBeApplied(delegateRegistrationTransaction, senderWallet)).rejects.toThrow(
                WalletIsAlreadyDelegateError,
            );
        });

        it("should throw if wallet is resigned delegate", async () => {
            senderWallet.setAttribute("delegate", { username: "dummy" });
            senderWallet.setAttribute("delegate.resigned", true);
            walletRepository.index(senderWallet);

            await expect(handler.throwIfCannotBeApplied(delegateRegistrationTransaction, senderWallet)).rejects.toThrow(
                WalletIsAlreadyDelegateError,
            );
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

            await expect(handler.throwIfCannotBeApplied(delegateRegistrationTransaction, senderWallet)).rejects.toThrow(
                WalletUsernameAlreadyRegisteredError,
            );
        });

        it("should throw if wallet has insufficient funds", async () => {
            senderWallet.setBalance(Utils.BigNumber.ZERO);

            await expect(handler.throwIfCannotBeApplied(delegateRegistrationTransaction, senderWallet)).rejects.toThrow(
                InsufficientBalanceError,
            );
        });

        it("should throw if wallet nonce is invalid", async () => {
            senderWallet.setNonce(Utils.BigNumber.ONE);

            await expect(handler.throwIfCannotBeApplied(delegateRegistrationTransaction, senderWallet)).rejects.toThrow(
                UnexpectedNonceError,
            );
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

            anotherWallet.setBalance(Utils.BigNumber.make(7527654310));

            walletRepository.index(anotherWallet);

            const anotherDelegateRegistrationTransaction = BuilderFactory.delegateRegistration()
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

        it("should throw if asset.delegate.username is undefined", async () => {
            // @ts-ignore
            delegateRegistrationTransaction.data.asset.delegate.username = undefined;

            await expect(handler.throwIfCannotEnterPool(delegateRegistrationTransaction)).rejects.toThrow(
                Exceptions.Runtime.AssertionException,
            );
        });

        it("should throw if asset.delegate is undefined", async () => {
            delegateRegistrationTransaction.data.asset!.delegate = undefined;

            await expect(handler.throwIfCannotEnterPool(delegateRegistrationTransaction)).rejects.toThrow(
                Exceptions.Runtime.AssertionException,
            );
        });

        it("should throw if asset is undefined", async () => {
            delegateRegistrationTransaction.data.asset = undefined;

            await expect(handler.throwIfCannotEnterPool(delegateRegistrationTransaction)).rejects.toThrow(
                Exceptions.Runtime.AssertionException,
            );
        });
    });

    describe("apply and revert", () => {
        it("should resolve", async () => {
            const walletBalance = senderWallet.getBalance();

            jest.spyOn(TransactionHandler.prototype, "applyToSender");

            await handler.apply(delegateRegistrationTransaction);

            expect(TransactionHandler.prototype.applyToSender).toHaveBeenCalledTimes(1);

            expect(senderWallet.getBalance()).toEqual(walletBalance.minus(delegateRegistrationTransaction.data.fee));
            expect(senderWallet.getNonce()).toEqual(Utils.BigNumber.ONE);
            expect(senderWallet.getAttribute("delegate.username")).toBe("dummy");
            expect(walletRepository.getIndex(Contracts.State.WalletIndexes.Usernames).has("dummy")).toBeTrue();
            expect(walletRepository.getIndex(Contracts.State.WalletIndexes.Usernames).get("dummy")).toBe(senderWallet);

            jest.spyOn(TransactionHandler.prototype, "revertForSender");

            await handler.revert(delegateRegistrationTransaction);

            expect(TransactionHandler.prototype.revertForSender).toHaveBeenCalledTimes(1);

            expect(senderWallet.getBalance()).toEqual(walletBalance);
            expect(senderWallet.getNonce()).toEqual(Utils.BigNumber.ZERO);
            expect(senderWallet.hasAttribute("delegate.username")).toBeFalse();
            expect(walletRepository.getIndex(Contracts.State.WalletIndexes.Usernames).has("dummy")).toBeFalse();
        });
    });

    describe("applyForSender", () => {
        it("should set username to wallet and index", async () => {
            await handler.applyToSender(delegateRegistrationTransaction);

            expect(senderWallet.getAttribute("delegate.username")).toBe("dummy");
            expect(walletRepository.getIndex(Contracts.State.WalletIndexes.Usernames).has("dummy")).toBeTrue();
        });

        it("should throw if asset.delegate.username is undefined", async () => {
            // @ts-ignore
            delegateRegistrationTransaction.data.asset.delegate.username = undefined;
            handler.throwIfCannotBeApplied = jest.fn();

            await expect(handler.applyToSender(delegateRegistrationTransaction)).rejects.toThrow(
                Exceptions.Runtime.AssertionException,
            );
        });

        it("should throw if asset.delegate is undefined", async () => {
            delegateRegistrationTransaction.data.asset!.delegate = undefined;
            handler.throwIfCannotBeApplied = jest.fn();

            await expect(handler.applyToSender(delegateRegistrationTransaction)).rejects.toThrow(
                Exceptions.Runtime.AssertionException,
            );
        });

        it("should throw if asset is undefined", async () => {
            delegateRegistrationTransaction.data.asset = undefined;
            handler.throwIfCannotBeApplied = jest.fn();

            await expect(handler.applyToSender(delegateRegistrationTransaction)).rejects.toThrow(
                Exceptions.Runtime.AssertionException,
            );
        });
    });
});
