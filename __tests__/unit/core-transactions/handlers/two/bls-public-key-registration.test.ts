import "jest-extended";

import { Application, Contracts, Exceptions, Utils } from "@packages/core-kernel";
// import { DelegateEvent } from "@packages/core-kernel/src/enums";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { Wallets } from "@packages/core-state";
import { StateStore } from "@packages/core-state/src/stores/state";
import { Mocks } from "@packages/core-test-framework";
import { Generators } from "@packages/core-test-framework/src";
import { Factories, FactoryBuilder } from "@packages/core-test-framework/src/factories";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import { Mempool } from "@packages/core-transaction-pool/src/mempool";
import { MempoolIndexes } from "@packages/core-transactions/src/enums";
import {
    BlsPublicKeyAlreadyExists,
    BlsPublicKeyNonDelegateError,
    InsufficientBalanceError,
    UnexpectedNonceError,
    WalletAlreadyResignedError,
} from "@packages/core-transactions/src/errors";
import { TransactionHandler } from "@packages/core-transactions/src/handlers";
import { TransactionHandlerRegistry } from "@packages/core-transactions/src/handlers/handler-registry";
import { Crypto, Enums, Interfaces, Managers, Transactions } from "@packages/crypto";
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
    app.bind(Identifiers.TransactionPoolMempoolIndex).toConstantValue(MempoolIndexes.BlsPublicKey);
    app.bind(Identifiers.TransactionHistoryService).toConstantValue(transactionHistoryService);

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    factoryBuilder = new FactoryBuilder();
    Factories.registerWalletFactory(factoryBuilder);
    Factories.registerTransactionFactory(factoryBuilder);

    senderWallet = buildSenderWallet(factoryBuilder);
    senderWallet.setAttribute("delegate", {
        username: "username",
        voteBalance: Utils.BigNumber.ZERO,
        forgedFees: Utils.BigNumber.ZERO,
        forgedRewards: Utils.BigNumber.ZERO,
        producedBlocks: 0,
        rank: undefined,
    });

    secondSignatureWallet = buildSecondSignatureWallet(factoryBuilder);
    secondSignatureWallet.setAttribute("delegate", {
        username: "username2",
        voteBalance: Utils.BigNumber.ZERO,
        forgedFees: Utils.BigNumber.ZERO,
        forgedRewards: Utils.BigNumber.ZERO,
        producedBlocks: 0,
        rank: undefined,
    });

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

describe("BlsPublicKeyRegistrationTransaction", () => {
    let blsPublicKeyRegistrationTransaction: Interfaces.ITransaction;
    let anotherBlsPublicKeyRegistrationTransaction: Interfaces.ITransaction;
    let secondBlsPublicKeyRegistrationTransaction: Interfaces.ITransaction;
    let handler: TransactionHandler;

    beforeEach(async () => {
        const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(
            Identifiers.TransactionHandlerRegistry,
        );
        handler = transactionHandlerRegistry.getRegisteredHandlerByType(
            Transactions.InternalTransactionType.from(
                Enums.TransactionType.BlsPublicKeyRegistration,
                Enums.TransactionTypeGroup.Core,
            ),
            2,
        );

        blsPublicKeyRegistrationTransaction = BuilderFactory.blsPublicKeyRegistration()
            .blsPublicKeyAsset("a".repeat(96))
            .nonce("1")
            .sign(passphrases[0])
            .build();

        anotherBlsPublicKeyRegistrationTransaction = BuilderFactory.blsPublicKeyRegistration()
            .blsPublicKeyAsset("a".repeat(96))
            .nonce("2")
            .sign(passphrases[2])
            .build();

        secondBlsPublicKeyRegistrationTransaction = BuilderFactory.blsPublicKeyRegistration()
            .blsPublicKeyAsset("b".repeat(96))
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
            expect(attributes.length).toBe(1);
        });
    });

    describe("getConstructor", () => {
        it("should return v2 constructor", async () => {
            expect(handler.getConstructor()).toBe(Transactions.Two.BlsPublicKeyRegistrationTransaction);
        });
    });

    // describe("isActivated", () => {
    //     it("should return true", async () => {
    //         await expect(handler.isActivated()).resolves.toBeTrue();
    //     });
    // });

    describe("bootstrap", () => {
        afterEach(() => {
            Mocks.BlockRepository.setDelegateForgedBlocks([]);
            Mocks.BlockRepository.setLastForgedBlocks([]);
        });

        it("should resolve", async () => {
            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield blsPublicKeyRegistrationTransaction.data;
            });

            expect(senderWallet.hasAttribute("blsPublicKey")).toBeFalse();

            await expect(handler.bootstrap()).toResolve();

            expect(transactionHistoryService.streamByCriteria).toBeCalledWith({
                typeGroup: Enums.TransactionTypeGroup.Core,
                type: Enums.TransactionType.BlsPublicKeyRegistration,
            });
            expect(
                walletRepository.getIndex(Contracts.State.WalletIndexes.BlsPublicKeys).has("a".repeat(96)),
            ).toBeTrue();
            expect(senderWallet.hasAttribute("blsPublicKey")).toBeTrue();
            expect(senderWallet.getAttribute("blsPublicKey")).toEqual("a".repeat(96));
        });

        it("should not resolve if asset.blsPublicKey is undefined", async () => {
            // @ts-ignore
            blsPublicKeyRegistrationTransaction.data.asset.blsPublicKey = undefined;

            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield blsPublicKeyRegistrationTransaction.data;
            });

            expect(senderWallet.hasAttribute("blsPublicKey")).toBeFalse();

            await expect(handler.bootstrap()).rejects.toThrow(Exceptions.Runtime.AssertionException);
            expect(
                walletRepository.getIndex(Contracts.State.WalletIndexes.BlsPublicKeys).has("a".repeat(96)),
            ).toBeFalse();
            expect(senderWallet.hasAttribute("blsPublicKey")).toBeFalse();
        });

        it("should not resolve if asset is undefined", async () => {
            blsPublicKeyRegistrationTransaction.data.asset = undefined;

            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield blsPublicKeyRegistrationTransaction.data;
            });

            expect(senderWallet.hasAttribute("blsPublicKey")).toBeFalse();

            await expect(handler.bootstrap()).rejects.toThrow(Exceptions.Runtime.AssertionException);
            expect(
                walletRepository.getIndex(Contracts.State.WalletIndexes.BlsPublicKeys).has("a".repeat(96)),
            ).toBeFalse();
            expect(senderWallet.hasAttribute("blsPublicKey")).toBeFalse();
        });
    });

    // describe("emitEvents", () => {
    //     it("should dispatch", async () => {
    //         const emitter: Contracts.Kernel.EventDispatcher = app.get<Contracts.Kernel.EventDispatcher>(
    //             Identifiers.EventDispatcherService,
    //         );

    //         const spy = jest.spyOn(emitter, "dispatch");

    //         handler.emitEvents(delegateRegistrationTransaction, emitter);

    //         expect(spy).toHaveBeenCalledWith(DelegateEvent.Registered, expect.anything());
    //     });
    // });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", async () => {
            jest.spyOn(TransactionHandler.prototype, "throwIfCannotBeApplied");

            await expect(handler.throwIfCannotBeApplied(blsPublicKeyRegistrationTransaction, senderWallet)).toResolve();

            expect(TransactionHandler.prototype.throwIfCannotBeApplied).toHaveBeenCalledTimes(1);
        });

        it("should not throw - second sign", async () => {
            jest.spyOn(TransactionHandler.prototype, "throwIfCannotBeApplied");

            await expect(
                handler.throwIfCannotBeApplied(secondBlsPublicKeyRegistrationTransaction, secondSignatureWallet),
            ).toResolve();

            expect(TransactionHandler.prototype.throwIfCannotBeApplied).toHaveBeenCalledTimes(1);
        });

        it("should throw if asset.blsPublicKey is undefined", async () => {
            // @ts-ignore
            blsPublicKeyRegistrationTransaction.data.asset.blsPublicKey = undefined;

            await expect(
                handler.throwIfCannotBeApplied(blsPublicKeyRegistrationTransaction, senderWallet),
            ).rejects.toThrow(Exceptions.Runtime.AssertionException);
        });

        it("should throw if asset is undefined", async () => {
            blsPublicKeyRegistrationTransaction.data.asset = undefined;

            await expect(
                handler.throwIfCannotBeApplied(blsPublicKeyRegistrationTransaction, senderWallet),
            ).rejects.toThrow(Exceptions.Runtime.AssertionException);
        });

        it("should throw if wallet is not delegate", async () => {
            senderWallet.forgetAttribute("delegate");
            walletRepository.index(senderWallet);

            await expect(
                handler.throwIfCannotBeApplied(blsPublicKeyRegistrationTransaction, senderWallet),
            ).rejects.toThrow(BlsPublicKeyNonDelegateError);
        });

        it("should throw if wallet is resigned delegate", async () => {
            senderWallet.setAttribute("delegate.resigned", true);
            walletRepository.index(senderWallet);

            await expect(
                handler.throwIfCannotBeApplied(blsPublicKeyRegistrationTransaction, senderWallet),
            ).rejects.toThrow(WalletAlreadyResignedError);
        });

        it("should throw if bls key is already regsitered", async () => {
            walletRepository.getIndex(Contracts.State.WalletIndexes.BlsPublicKeys).set("a".repeat(96), senderWallet);

            await expect(
                handler.throwIfCannotBeApplied(blsPublicKeyRegistrationTransaction, senderWallet),
            ).rejects.toThrow(BlsPublicKeyAlreadyExists);
        });

        it("should throw if wallet has insufficient funds", async () => {
            senderWallet.setBalance(Utils.BigNumber.ZERO);

            await expect(
                handler.throwIfCannotBeApplied(blsPublicKeyRegistrationTransaction, senderWallet),
            ).rejects.toThrow(InsufficientBalanceError);
        });

        it("should throw if wallet nonce is invalid", async () => {
            senderWallet.setNonce(Utils.BigNumber.ONE);

            await expect(
                handler.throwIfCannotBeApplied(blsPublicKeyRegistrationTransaction, senderWallet),
            ).rejects.toThrow(UnexpectedNonceError);
        });
    });

    describe("throwIfCannotEnterPool", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotEnterPool(blsPublicKeyRegistrationTransaction)).toResolve();
        });

        it("should throw if transaction with same blsPublicKey already in pool", async () => {
            await app
                .get<Mempool>(Identifiers.TransactionPoolMempool)
                .addTransaction(blsPublicKeyRegistrationTransaction);

            await expect(handler.throwIfCannotEnterPool(anotherBlsPublicKeyRegistrationTransaction)).rejects.toThrow(
                `BLS Public Key "${"a".repeat(96)}" already in the pool`,
            );
        });

        it("should throw if asset.blsPublicKey is undefined", async () => {
            // @ts-ignore
            blsPublicKeyRegistrationTransaction.data.asset.blsPublicKey = undefined;

            await expect(handler.throwIfCannotEnterPool(blsPublicKeyRegistrationTransaction)).rejects.toThrow(
                Exceptions.Runtime.AssertionException,
            );
        });

        it("should throw if asset is undefined", async () => {
            blsPublicKeyRegistrationTransaction.data.asset = undefined;

            await expect(handler.throwIfCannotEnterPool(blsPublicKeyRegistrationTransaction)).rejects.toThrow(
                Exceptions.Runtime.AssertionException,
            );
        });
    });

    describe("onPoolEnter", () => {
        it("should set blsPublicKey on BlsPublicKey index", async () => {
            const mempoolIndexRegistry = app.get<Contracts.TransactionPool.MempoolIndexRegistry>(
                Identifiers.TransactionPoolMempoolIndexRegistry,
            );

            const spyOnIndexSet = jest.spyOn(mempoolIndexRegistry.get(MempoolIndexes.BlsPublicKey), "set");

            await expect(handler.onPoolEnter(blsPublicKeyRegistrationTransaction)).toResolve();
            expect(spyOnIndexSet).toBeCalledTimes(1);
            expect(spyOnIndexSet).toBeCalledWith(
                blsPublicKeyRegistrationTransaction.data.asset.blsPublicKey,
                blsPublicKeyRegistrationTransaction,
            );
        });
    });

    describe("onPoolLeave", () => {
        it("should forget username on DelegateUsername index", async () => {
            const mempoolIndexRegistry = app.get<Contracts.TransactionPool.MempoolIndexRegistry>(
                Identifiers.TransactionPoolMempoolIndexRegistry,
            );

            const spyOnIndexSet = jest.spyOn(mempoolIndexRegistry.get(MempoolIndexes.BlsPublicKey), "forget");

            await expect(handler.onPoolLeave(blsPublicKeyRegistrationTransaction)).toResolve();
            expect(spyOnIndexSet).toBeCalledTimes(1);
            expect(spyOnIndexSet).toBeCalledWith(blsPublicKeyRegistrationTransaction.data.asset.blsPublicKey);
        });
    });

    describe("getInvalidPoolTransactions", () => {
        it("should return empty array if there are no invalid transactions", async () => {
            const mempoolIndexRegistry = app.get<Contracts.TransactionPool.MempoolIndexRegistry>(
                Identifiers.TransactionPoolMempoolIndexRegistry,
            );

            const spyOnIndexHas = jest
                .spyOn(mempoolIndexRegistry.get(MempoolIndexes.BlsPublicKey), "has")
                .mockReturnValueOnce(false);

            await expect(handler.getInvalidPoolTransactions(blsPublicKeyRegistrationTransaction)).resolves.toEqual([]);
            expect(spyOnIndexHas).toBeCalledTimes(1);
            expect(spyOnIndexHas).toBeCalledWith(blsPublicKeyRegistrationTransaction.data.asset.blsPublicKey);
        });

        it("should return invalid transaction if transaction with same username is indexed", async () => {
            const mempoolIndexRegistry = app.get<Contracts.TransactionPool.MempoolIndexRegistry>(
                Identifiers.TransactionPoolMempoolIndexRegistry,
            );

            const spyOnIndexHas = jest
                .spyOn(mempoolIndexRegistry.get(MempoolIndexes.BlsPublicKey), "has")
                .mockReturnValueOnce(true);

            const spyOnIndexGet = jest
                .spyOn(mempoolIndexRegistry.get(MempoolIndexes.BlsPublicKey), "get")
                .mockReturnValueOnce(anotherBlsPublicKeyRegistrationTransaction);

            await expect(handler.getInvalidPoolTransactions(blsPublicKeyRegistrationTransaction)).resolves.toEqual([
                anotherBlsPublicKeyRegistrationTransaction,
            ]);
            expect(spyOnIndexHas).toBeCalledTimes(1);
            expect(spyOnIndexHas).toBeCalledWith(blsPublicKeyRegistrationTransaction.data.asset.blsPublicKey);
            expect(spyOnIndexGet).toBeCalledTimes(1);
            expect(spyOnIndexGet).toBeCalledWith(blsPublicKeyRegistrationTransaction.data.asset.blsPublicKey);
        });
    });

    describe("apply and revert", () => {
        it("should resolve", async () => {
            const walletBalance = senderWallet.getBalance();

            jest.spyOn(TransactionHandler.prototype, "applyToSender");

            await handler.apply(blsPublicKeyRegistrationTransaction);

            expect(TransactionHandler.prototype.applyToSender).toHaveBeenCalledTimes(1);

            expect(senderWallet.getBalance()).toEqual(
                walletBalance.minus(blsPublicKeyRegistrationTransaction.data.fee),
            );
            expect(senderWallet.getNonce()).toEqual(Utils.BigNumber.ONE);
            expect(senderWallet.getAttribute("blsPublicKey")).toBe("a".repeat(96));
            expect(
                walletRepository.getIndex(Contracts.State.WalletIndexes.BlsPublicKeys).has("a".repeat(96)),
            ).toBeTrue();
            expect(walletRepository.getIndex(Contracts.State.WalletIndexes.BlsPublicKeys).get("a".repeat(96))).toBe(
                senderWallet,
            );

            jest.spyOn(TransactionHandler.prototype, "revertForSender");

            await handler.revert(blsPublicKeyRegistrationTransaction);

            expect(TransactionHandler.prototype.revertForSender).toHaveBeenCalledTimes(1);

            expect(senderWallet.getBalance()).toEqual(walletBalance);
            expect(senderWallet.getNonce()).toEqual(Utils.BigNumber.ZERO);
            expect(senderWallet.hasAttribute("blsPublicKey")).toBeFalse();
            expect(
                walletRepository.getIndex(Contracts.State.WalletIndexes.BlsPublicKeys).has("a".repeat(96)),
            ).toBeFalse();
        });
    });

    describe("applyForSender", () => {
        it("should set username to wallet and index", async () => {
            await handler.applyToSender(blsPublicKeyRegistrationTransaction);

            expect(senderWallet.getAttribute("blsPublicKey")).toBe("a".repeat(96));
            expect(
                walletRepository.getIndex(Contracts.State.WalletIndexes.BlsPublicKeys).has("a".repeat(96)),
            ).toBeTrue();
        });

        it("should throw if asset.blsPublicKey is undefined", async () => {
            // @ts-ignore
            blsPublicKeyRegistrationTransaction.data.asset.blsPublicKey = undefined;
            handler.throwIfCannotBeApplied = jest.fn();

            await expect(handler.applyToSender(blsPublicKeyRegistrationTransaction)).rejects.toThrow(
                Exceptions.Runtime.AssertionException,
            );
        });

        it("should throw if asset is undefined", async () => {
            blsPublicKeyRegistrationTransaction.data.asset = undefined;
            handler.throwIfCannotBeApplied = jest.fn();

            await expect(handler.applyToSender(blsPublicKeyRegistrationTransaction)).rejects.toThrow(
                Exceptions.Runtime.AssertionException,
            );
        });
    });
});
