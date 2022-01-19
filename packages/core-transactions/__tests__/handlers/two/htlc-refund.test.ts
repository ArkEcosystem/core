import "jest-extended";

import { Application, Contracts, Exceptions } from "@packages/core-kernel";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { Wallets } from "@packages/core-state";
import { StateStore } from "@packages/core-state/src/stores/state";
import { Mapper, Mocks } from "@packages/core-test-framework";
import { Generators } from "@packages/core-test-framework/src";
import { Factories, FactoryBuilder } from "@packages/core-test-framework/src/factories";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import { Mempool } from "@packages/core-transaction-pool/src/mempool";
import { HtlcLockNotExpiredError, HtlcLockTransactionNotFoundError } from "@packages/core-transactions/src/errors";
import { TransactionHandler } from "@packages/core-transactions/src/handlers";
import { TransactionHandlerRegistry } from "@packages/core-transactions/src/handlers/handler-registry";
import { Crypto, Enums, Interfaces, Managers, Transactions, Utils } from "@packages/crypto";
import { BuilderFactory } from "@packages/crypto/dist/transactions";
import { configManager } from "@packages/crypto/src/managers";

import { htlcSecretHashHex } from "../__fixtures__/htlc-secrets";
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

const { EpochTimestamp, BlockHeight } = Enums.HtlcLockExpirationType;

const mockLastBlockData: Partial<Interfaces.IBlockData> = { timestamp: Crypto.Slots.getTime(), height: 4 };

const makeBlockHeightTimestamp = (heightRelativeToLastBlock = 2) =>
    mockLastBlockData.height! + heightRelativeToLastBlock;
const makeExpiredTimestamp = (type) =>
    type === EpochTimestamp ? mockLastBlockData.timestamp! - 9 : makeBlockHeightTimestamp(-2);
const makeNotExpiredTimestamp = (type) =>
    type === EpochTimestamp ? mockLastBlockData.timestamp! + 999 : makeBlockHeightTimestamp(9);

const mockGetLastBlock = jest.fn();
StateStore.prototype.getLastBlock = mockGetLastBlock;
mockGetLastBlock.mockReturnValue({ data: mockLastBlockData });

beforeEach(() => {
    const config = Generators.generateCryptoConfigRaw();
    configManager.setConfig(config);
    Managers.configManager.setConfig(config);

    app = initApp();
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
    Mocks.TransactionRepository.setTransactions([]);
});

describe("Htlc refund", () => {
    describe.each([EpochTimestamp, BlockHeight])("Htlc refund - expiration type %i", (expirationType) => {
        const lockPassphrase = passphrases[2];
        let htlcLockTransaction: Interfaces.ITransaction;
        let htlcRefundTransaction: Interfaces.ITransaction;
        let secondSignatureHtlcRefundTransaction: Interfaces.ITransaction;
        let multiSignatureHtlcRefundTransaction: Interfaces.ITransaction;
        let handler: TransactionHandler;
        let lockWallet: Wallets.Wallet;
        const amount = 6 * 1e8;

        beforeAll(() => {
            Managers.configManager.setFromPreset("testnet");
        });

        beforeEach(async () => {
            const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(
                Identifiers.TransactionHandlerRegistry,
            );
            handler = transactionHandlerRegistry.getRegisteredHandlerByType(
                Transactions.InternalTransactionType.from(
                    Enums.TransactionType.HtlcRefund,
                    Enums.TransactionTypeGroup.Core,
                ),
                2,
            );

            lockWallet = factoryBuilder
                .get("Wallet")
                .withOptions({
                    passphrase: lockPassphrase,
                    nonce: 0,
                })
                .make();

            walletRepository.index(lockWallet);

            const expiration = {
                type: expirationType,
                value: makeExpiredTimestamp(expirationType),
            };

            htlcLockTransaction = BuilderFactory.htlcLock()
                .htlcLockAsset({
                    secretHash: htlcSecretHashHex,
                    expiration: expiration,
                })
                .recipientId(recipientWallet.getAddress())
                .amount(amount.toString())
                .nonce("1")
                // .vendorField("dummy")
                .sign(lockPassphrase)
                .build();

            lockWallet.setAttribute("htlc.lockedBalance", Utils.BigNumber.make(amount));

            lockWallet.setAttribute("htlc.locks", {
                [htlcLockTransaction.id!]: {
                    amount: htlcLockTransaction.data.amount,
                    recipientId: htlcLockTransaction.data.recipientId,
                    ...htlcLockTransaction.data.asset!.lock,
                },
            });

            walletRepository.index(lockWallet);

            htlcRefundTransaction = BuilderFactory.htlcRefund()
                .htlcRefundAsset({
                    lockTransactionId: htlcLockTransaction.id!,
                })
                .nonce("1")
                .sign(lockPassphrase)
                .build();

            secondSignatureHtlcRefundTransaction = BuilderFactory.htlcRefund()
                .htlcRefundAsset({
                    lockTransactionId: htlcLockTransaction.id!,
                })
                .nonce("1")
                .sign(passphrases[1])
                .secondSign(passphrases[2])
                .build();

            multiSignatureHtlcRefundTransaction = BuilderFactory.htlcRefund()
                .htlcRefundAsset({
                    lockTransactionId: htlcLockTransaction.id!,
                })
                .nonce("1")
                .senderPublicKey(multiSignatureWallet.getPublicKey()!)
                .multiSign(passphrases[0], 0)
                .multiSign(passphrases[1], 1)
                .multiSign(passphrases[2], 2)
                .build();
        });

        describe("bootstrap", () => {
            it("should resolve", async () => {
                Mocks.TransactionRepository.setTransactions([Mapper.mapTransactionToModel(htlcLockTransaction)]);
                await expect(handler.bootstrap()).toResolve();
            });
        });

        describe("dynamicFees", () => {
            it("should be zero", async () => {
                expect(
                    handler.dynamicFee({
                        transaction: htlcRefundTransaction,
                        addonBytes: 137,
                        satoshiPerByte: 3,
                        height: 1,
                    }),
                ).toBe(Utils.BigNumber.ZERO);
            });
        });

        describe("throwIfCannotBeApplied", () => {
            it("should not throw", async () => {
                await expect(handler.throwIfCannotBeApplied(htlcRefundTransaction, lockWallet)).toResolve();
            });

            it("should not throw - second sign", async () => {
                await expect(
                    handler.throwIfCannotBeApplied(secondSignatureHtlcRefundTransaction, secondSignatureWallet),
                ).toResolve();
            });

            it("should not throw - multi sign", async () => {
                await expect(
                    handler.throwIfCannotBeApplied(multiSignatureHtlcRefundTransaction, multiSignatureWallet),
                ).toResolve();
            });

            it("should throw if asset is undefined", async () => {
                htlcRefundTransaction.data.asset = undefined;

                await expect(handler.throwIfCannotBeApplied(htlcRefundTransaction, lockWallet)).rejects.toThrow(
                    Exceptions.Runtime.AssertionException,
                );
            });

            it("should throw if asset.refund is undefined", async () => {
                // @ts-ignore
                htlcRefundTransaction.data.asset.refund = undefined;

                await expect(handler.throwIfCannotBeApplied(htlcRefundTransaction, lockWallet)).rejects.toThrow(
                    Exceptions.Runtime.AssertionException,
                );
            });

            it("should throw if no wallet has a lock with associated transaction id", async () => {
                lockWallet.setAttribute("htlc.locks", {});

                await expect(handler.throwIfCannotBeApplied(htlcRefundTransaction, lockWallet)).rejects.toThrow(
                    HtlcLockTransactionNotFoundError,
                );
            });

            it("should not throw if refund wallet is not sender of lock transaction", async () => {
                const dummyPassphrase = "not recipient of lock";
                const dummyWallet: Wallets.Wallet = factoryBuilder
                    .get("Wallet")
                    .withOptions({
                        passphrase: dummyPassphrase,
                        nonce: 0,
                    })
                    .make();

                walletRepository.index(dummyWallet);

                htlcRefundTransaction = BuilderFactory.htlcRefund()
                    .htlcRefundAsset({
                        lockTransactionId: htlcLockTransaction.id!,
                    })
                    .nonce("1")
                    .sign(dummyPassphrase)
                    .build();

                await expect(handler.throwIfCannotBeApplied(htlcRefundTransaction, dummyWallet)).toResolve();
            });

            it("should throw if lock didn't expire - expiration type %i", async () => {
                const amount = 6 * 1e8;
                const expiration = {
                    type: expirationType,
                    value: makeNotExpiredTimestamp(expirationType),
                };

                htlcLockTransaction = BuilderFactory.htlcLock()
                    .htlcLockAsset({
                        secretHash: htlcSecretHashHex,
                        expiration: expiration,
                    })
                    .recipientId(recipientWallet.getAddress())
                    .amount(amount.toString())
                    .nonce("1")
                    .sign(lockPassphrase)
                    .build();

                lockWallet.setAttribute("htlc.lockedBalance", Utils.BigNumber.make(amount));

                lockWallet.setAttribute("htlc.locks", {
                    [htlcLockTransaction.id!]: {
                        amount: htlcLockTransaction.data.amount,
                        recipientId: htlcLockTransaction.data.recipientId,
                        ...htlcLockTransaction.data.asset!.lock,
                    },
                });

                walletRepository.index(lockWallet);

                htlcRefundTransaction = BuilderFactory.htlcRefund()
                    .htlcRefundAsset({
                        lockTransactionId: htlcLockTransaction.id!,
                    })
                    .nonce("1")
                    .sign(lockPassphrase)
                    .build();

                await expect(handler.throwIfCannotBeApplied(htlcRefundTransaction, lockWallet)).rejects.toThrow(
                    HtlcLockNotExpiredError,
                );
            });
        });

        describe("throwIfCannotEnterPool", () => {
            it("should not throw", async () => {
                await expect(handler.throwIfCannotEnterPool(htlcRefundTransaction)).toResolve();
            });

            it("should throw if asset is undefined", async () => {
                htlcRefundTransaction.data.asset = undefined;

                await expect(handler.throwIfCannotEnterPool(htlcRefundTransaction)).rejects.toThrow(
                    Exceptions.Runtime.AssertionException,
                );
            });

            it("should throw if asset.refund is undefined", async () => {
                // @ts-ignore
                htlcRefundTransaction.data.asset.refund = undefined;

                await expect(handler.throwIfCannotEnterPool(htlcRefundTransaction)).rejects.toThrow(
                    Exceptions.Runtime.AssertionException,
                );
            });

            it("should throw if no wallet has a lock with associated transaction id", async () => {
                lockWallet.setAttribute("htlc.locks", {});

                await expect(handler.throwIfCannotEnterPool(htlcRefundTransaction)).rejects.toThrowError(
                    Contracts.TransactionPool.PoolError,
                );
            });

            it("should throw if refund transaction already in pool", async () => {
                const anotherHtlcRefundTransaction = BuilderFactory.htlcRefund()
                    .htlcRefundAsset({
                        lockTransactionId: htlcLockTransaction.id!,
                    })
                    .nonce("1")
                    .sign(passphrases[2])
                    .build();

                await app.get<Mempool>(Identifiers.TransactionPoolMempool).addTransaction(anotherHtlcRefundTransaction);

                lockWallet.setAttribute("htlc.lockedBalance", Utils.BigNumber.make(6 * 1e8));

                lockWallet.setAttribute("htlc.locks", {
                    [htlcLockTransaction.id!]: {
                        amount: htlcLockTransaction.data.amount,
                        recipientId: htlcLockTransaction.data.recipientId,
                        ...htlcLockTransaction.data.asset!.lock,
                    },
                });

                walletRepository.index(lockWallet);

                await expect(handler.throwIfCannotEnterPool(htlcRefundTransaction)).rejects.toThrow(
                    Contracts.TransactionPool.PoolError,
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
            });

            it("should apply htlc refund transaction", async () => {
                await expect(handler.throwIfCannotBeApplied(htlcRefundTransaction, lockWallet)).toResolve();

                const balanceBefore = lockWallet.getBalance();

                // @ts-ignore
                expect(lockWallet.getAttribute("htlc.locks")[htlcLockTransaction.id]).toBeDefined();
                expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(htlcLockTransaction.data.amount);

                await handler.apply(htlcRefundTransaction);

                expect(lockWallet.hasAttribute("htlc")).toBe(false);
                expect(lockWallet.getBalance()).toEqual(
                    balanceBefore.plus(htlcLockTransaction.data.amount).minus(htlcRefundTransaction.data.fee),
                );
            });

            it("should apply htlc refund transaction if lockWallet contains another locks", async () => {
                await expect(handler.throwIfCannotBeApplied(htlcRefundTransaction, lockWallet)).toResolve();

                const balanceBefore = lockWallet.getBalance();

                lockWallet.setAttribute("htlc.lockedBalance", Utils.BigNumber.make(amount).plus(amount));
                lockWallet.setAttribute("htlc.locks", {
                    [htlcLockTransaction.id!]: {
                        amount: htlcLockTransaction.data.amount,
                        recipientId: htlcLockTransaction.data.recipientId,
                        ...htlcLockTransaction.data.asset!.lock,
                    },
                    ["dummy_id"]: {
                        amount: htlcLockTransaction.data.amount,
                        recipientId: htlcLockTransaction.data.recipientId,
                        ...htlcLockTransaction.data.asset!.lock,
                    },
                });

                walletRepository.index(lockWallet);
                // @ts-ignore
                expect(lockWallet.getAttribute("htlc.locks")[htlcLockTransaction.id]).toBeDefined();
                expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(
                    htlcLockTransaction.data.amount.plus(amount),
                );

                await handler.apply(htlcRefundTransaction);

                expect(lockWallet.hasAttribute("htlc.locks")).toBeTrue();
                expect(lockWallet.getAttribute("htlc.locks")).toContainKey("dummy_id");
                expect(lockWallet.getBalance()).toEqual(
                    balanceBefore.plus(htlcLockTransaction.data.amount).minus(htlcRefundTransaction.data.fee),
                );
            });

            it("should apply htlc refund transaction defined as exception", async () => {
                configManager.set("network.pubKeyHash", 99);
                configManager.set("exceptions.transactions", [htlcRefundTransaction.id]);

                await expect(handler.apply(htlcRefundTransaction)).toResolve();
            });

            it("should apply htlc refund transaction - when sender is not refund wallet", async () => {
                const dummyPassphrase = "not recipient of lock";
                const dummyWallet: Wallets.Wallet = factoryBuilder
                    .get("Wallet")
                    .withOptions({
                        passphrase: dummyPassphrase,
                        nonce: 0,
                    })
                    .make();

                walletRepository.index(dummyWallet);

                htlcRefundTransaction = BuilderFactory.htlcRefund()
                    .htlcRefundAsset({
                        lockTransactionId: htlcLockTransaction.id!,
                    })
                    .nonce("1")
                    .sign(dummyPassphrase)
                    .build();

                await expect(handler.throwIfCannotBeApplied(htlcRefundTransaction, dummyWallet)).toResolve();

                const balanceBefore = lockWallet.getBalance();

                // @ts-ignore
                expect(lockWallet.getAttribute("htlc.locks")[htlcLockTransaction.id]).toBeDefined();
                expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(htlcLockTransaction.data.amount);

                await handler.apply(htlcRefundTransaction);

                expect(lockWallet.hasAttribute("htlc")).toBe(false);
                expect(lockWallet.getBalance()).toEqual(
                    balanceBefore.plus(htlcLockTransaction.data.amount).minus(htlcRefundTransaction.data.fee),
                );
            });

            it("should throw if asset is undefined", async () => {
                htlcRefundTransaction.data.asset = undefined;

                handler.throwIfCannotBeApplied = jest.fn();

                await expect(handler.apply(htlcRefundTransaction)).rejects.toThrow(
                    Exceptions.Runtime.AssertionException,
                );
            });

            it("should throw if asset.refund is undefined", async () => {
                // @ts-ignore
                htlcRefundTransaction.data.asset.refund = undefined;

                handler.throwIfCannotBeApplied = jest.fn();

                await expect(handler.apply(htlcRefundTransaction)).rejects.toThrow(
                    Exceptions.Runtime.AssertionException,
                );
            });
        });

        describe("revert", () => {
            it("should be ok", async () => {
                await expect(handler.throwIfCannotBeApplied(htlcRefundTransaction, lockWallet)).toResolve();

                Mocks.TransactionRepository.setTransactions([Mapper.mapTransactionToModel(htlcLockTransaction)]);
                const balanceBefore = lockWallet.getBalance();

                await handler.apply(htlcRefundTransaction);

                // @ts-ignore
                expect(lockWallet.hasAttribute("htlc")).toBe(false);
                expect(lockWallet.getBalance()).toEqual(
                    balanceBefore.plus(htlcLockTransaction.data.amount).minus(htlcRefundTransaction.data.fee),
                );

                await handler.revert(htlcRefundTransaction);

                const foundLockWallet = walletRepository.findByIndex(
                    Contracts.State.WalletIndexes.Locks,
                    htlcLockTransaction.id!,
                );
                expect(foundLockWallet).toBeDefined();
                expect(foundLockWallet.getAttribute("htlc.locks")[htlcLockTransaction.id!]).toEqual({
                    amount: htlcLockTransaction.data.amount,
                    recipientId: htlcLockTransaction.data.recipientId,
                    ...htlcLockTransaction.data.asset!.lock,
                });

                expect(foundLockWallet.getAttribute("htlc.lockedBalance")).toEqual(htlcLockTransaction.data.amount);
                expect(foundLockWallet.getBalance()).toEqual(balanceBefore);
            });

            it("should be ok if lcok transaction has vendor field", async () => {
                htlcLockTransaction.data.vendorField = "dummy";

                await expect(handler.throwIfCannotBeApplied(htlcRefundTransaction, lockWallet)).toResolve();

                Mocks.TransactionRepository.setTransactions([Mapper.mapTransactionToModel(htlcLockTransaction)]);
                const balanceBefore = lockWallet.getBalance();

                await handler.apply(htlcRefundTransaction);

                // @ts-ignore
                expect(lockWallet.hasAttribute("htlc")).toBe(false);
                expect(lockWallet.getBalance()).toEqual(
                    balanceBefore.plus(htlcLockTransaction.data.amount).minus(htlcRefundTransaction.data.fee),
                );

                await handler.revert(htlcRefundTransaction);

                const foundLockWallet = walletRepository.findByIndex(
                    Contracts.State.WalletIndexes.Locks,
                    htlcLockTransaction.id!,
                );
                expect(foundLockWallet).toBeDefined();

                expect(foundLockWallet.getAttribute("htlc.lockedBalance")).toEqual(htlcLockTransaction.data.amount);
                expect(foundLockWallet.getBalance()).toEqual(balanceBefore);
            });

            it("should throw if asset is undefined", async () => {
                await expect(handler.apply(htlcRefundTransaction)).toResolve();

                htlcRefundTransaction.data.asset = undefined;

                await expect(handler.revert(htlcRefundTransaction)).rejects.toThrow(
                    Exceptions.Runtime.AssertionException,
                );
            });

            it("should throw if asset.refund is undefined", async () => {
                await expect(handler.apply(htlcRefundTransaction)).toResolve();

                // @ts-ignore
                htlcRefundTransaction.data.asset.refund = undefined;

                await expect(handler.revert(htlcRefundTransaction)).rejects.toThrow(
                    Exceptions.Runtime.AssertionException,
                );
            });

            it("should throw if lockedTransaction.asset is undefined", async () => {
                await expect(handler.apply(htlcRefundTransaction)).toResolve();

                htlcLockTransaction.data.asset = undefined;
                Mocks.TransactionRepository.setTransactions([Mapper.mapTransactionToModel(htlcLockTransaction)]);

                await expect(handler.revert(htlcRefundTransaction)).rejects.toThrow(
                    Exceptions.Runtime.AssertionException,
                );
            });
        });
    });
});
