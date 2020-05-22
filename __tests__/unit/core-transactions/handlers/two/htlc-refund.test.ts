import "jest-extended";

import { CryptoSuite, Interfaces as BlockInterfaces } from "@packages/core-crypto/src";
import { Application, Contracts } from "@packages/core-kernel";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { Wallets } from "@packages/core-state";
import { StateStore } from "@packages/core-state/src/stores/state";
import { Mapper, Mocks } from "@packages/core-test-framework/src";
import { Generators } from "@packages/core-test-framework/src";
import { Factories, FactoryBuilder } from "@packages/core-test-framework/src/factories";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import { Mempool } from "@packages/core-transaction-pool/src/mempool";
import { HtlcLockNotExpiredError, HtlcLockTransactionNotFoundError } from "@packages/core-transactions/src/errors";
import { TransactionHandler } from "@packages/core-transactions/src/handlers";
import { TransactionHandlerRegistry } from "@packages/core-transactions/src/handlers/handler-registry";
import { Enums, Interfaces, Transactions } from "@packages/crypto";

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

let mockLastBlockData: Partial<BlockInterfaces.IBlockData>;
let makeBlockHeightTimestamp;
let makeExpiredTimestamp;
let makeNotExpiredTimestamp;

const mockGetLastBlock = jest.fn();

let crypto: CryptoSuite.CryptoSuite;

beforeEach(() => {
    crypto = new CryptoSuite.CryptoSuite({
        ...Generators.generateCryptoConfigRaw(),
    });
    crypto.CryptoManager.HeightTracker.setHeight(2);

    app = initApp(crypto);

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    mockLastBlockData = { timestamp: crypto.CryptoManager.LibraryManager.Crypto.Slots.getTime(), height: 4 };
    makeBlockHeightTimestamp = (heightRelativeToLastBlock = 2) => mockLastBlockData.height! + heightRelativeToLastBlock;
    makeExpiredTimestamp = (type) =>
        type === EpochTimestamp ? mockLastBlockData.timestamp! - 9 : makeBlockHeightTimestamp(-2);
    makeNotExpiredTimestamp = (type) =>
        type === EpochTimestamp ? mockLastBlockData.timestamp! + 999 : makeBlockHeightTimestamp(9);

    StateStore.prototype.getLastBlock = mockGetLastBlock;
    mockGetLastBlock.mockReturnValue({ data: mockLastBlockData });

    factoryBuilder = new FactoryBuilder(crypto as any);
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

afterEach(() => {
    Mocks.TransactionRepository.setTransactions([]);
});

describe("Htlc refund", () => {
    describe.each([EpochTimestamp, BlockHeight])("Htlc refund - expiration type %i", (expirationType) => {
        const lockPassphrase = passphrases[2];
        let htlcLockTransaction: Interfaces.ITransaction;
        let htlcRefundTransaction: Interfaces.ITransaction;
        let htlcRefundTransactionException: Interfaces.ITransaction;
        let secondSignatureHtlcRefundTransaction: Interfaces.ITransaction;
        let multiSignatureHtlcRefundTransaction: Interfaces.ITransaction;
        let handler: TransactionHandler;
        let lockWallet: Wallets.Wallet;

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

            const amount = 6 * 1e8;
            const expiration = {
                type: expirationType,
                value: makeExpiredTimestamp(expirationType),
            };

            htlcLockTransaction = crypto.TransactionManager.BuilderFactory.htlcLock()
                .htlcLockAsset({
                    secretHash: htlcSecretHashHex,
                    expiration: expiration,
                })
                .recipientId(recipientWallet.address)
                .amount(amount.toString())
                .nonce("1")
                // .vendorField("dummy")
                .sign(lockPassphrase)
                .build();

            lockWallet.setAttribute(
                "htlc.lockedBalance",
                crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make(amount),
            );

            lockWallet.setAttribute("htlc.locks", {
                [htlcLockTransaction.id!]: {
                    amount: htlcLockTransaction.data.amount,
                    recipientId: htlcLockTransaction.data.recipientId,
                    ...htlcLockTransaction.data.asset!.lock,
                },
            });

            walletRepository.index(lockWallet);

            htlcRefundTransaction = crypto.TransactionManager.BuilderFactory.htlcRefund()
                .htlcRefundAsset({
                    lockTransactionId: htlcLockTransaction.id!,
                })
                .nonce("1")
                .sign(lockPassphrase)
                .build();

            htlcRefundTransactionException = crypto.TransactionManager.BuilderFactory.htlcRefund()
                .htlcRefundAsset({
                    lockTransactionId: htlcLockTransaction.id!,
                })
                .nonce("1")
                .sign("other")
                .build();

            secondSignatureHtlcRefundTransaction = crypto.TransactionManager.BuilderFactory.htlcRefund()
                .htlcRefundAsset({
                    lockTransactionId: htlcLockTransaction.id!,
                })
                .nonce("1")
                .sign(passphrases[1])
                .secondSign(passphrases[2])
                .build();

            multiSignatureHtlcRefundTransaction = crypto.TransactionManager.BuilderFactory.htlcRefund()
                .htlcRefundAsset({
                    lockTransactionId: htlcLockTransaction.id!,
                })
                .nonce("1")
                .senderPublicKey(multiSignatureWallet.publicKey!)
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
                ).toBe(crypto.CryptoManager.LibraryManager.Libraries.BigNumber.ZERO);
            });
        });

        describe("throwIfCannotBeApplied", () => {
            it("should not throw", async () => {
                await expect(
                    handler.throwIfCannotBeApplied(htlcRefundTransaction, lockWallet, walletRepository),
                ).toResolve();
            });

            it("should not throw - second sign", async () => {
                await expect(
                    handler.throwIfCannotBeApplied(
                        secondSignatureHtlcRefundTransaction,
                        secondSignatureWallet,
                        walletRepository,
                    ),
                ).toResolve();
            });

            it("should not throw - multi sign", async () => {
                await expect(
                    handler.throwIfCannotBeApplied(
                        multiSignatureHtlcRefundTransaction,
                        multiSignatureWallet,
                        walletRepository,
                    ),
                ).toResolve();
            });

            it("should throw if no wallet has a lock with associated transaction id", async () => {
                lockWallet.setAttribute("htlc.locks", {});

                await expect(
                    handler.throwIfCannotBeApplied(htlcRefundTransaction, lockWallet, walletRepository),
                ).rejects.toThrow(HtlcLockTransactionNotFoundError);
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

                htlcRefundTransaction = crypto.TransactionManager.BuilderFactory.htlcRefund()
                    .htlcRefundAsset({
                        lockTransactionId: htlcLockTransaction.id!,
                    })
                    .nonce("1")
                    .sign(dummyPassphrase)
                    .build();

                await expect(
                    handler.throwIfCannotBeApplied(htlcRefundTransaction, dummyWallet, walletRepository),
                ).toResolve();
            });

            it("should throw if lock didn't expire - expiration type %i", async () => {
                const amount = 6 * 1e8;
                const expiration = {
                    type: expirationType,
                    value: makeNotExpiredTimestamp(expirationType),
                };

                htlcLockTransaction = crypto.TransactionManager.BuilderFactory.htlcLock()
                    .htlcLockAsset({
                        secretHash: htlcSecretHashHex,
                        expiration: expiration,
                    })
                    .recipientId(recipientWallet.address)
                    .amount(amount.toString())
                    .nonce("1")
                    .sign(lockPassphrase)
                    .build();

                lockWallet.setAttribute(
                    "htlc.lockedBalance",
                    crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make(amount),
                );

                lockWallet.setAttribute("htlc.locks", {
                    [htlcLockTransaction.id!]: {
                        amount: htlcLockTransaction.data.amount,
                        recipientId: htlcLockTransaction.data.recipientId,
                        ...htlcLockTransaction.data.asset!.lock,
                    },
                });

                walletRepository.index(lockWallet);

                htlcRefundTransaction = crypto.TransactionManager.BuilderFactory.htlcRefund()
                    .htlcRefundAsset({
                        lockTransactionId: htlcLockTransaction.id!,
                    })
                    .nonce("1")
                    .sign(lockPassphrase)
                    .build();

                await expect(
                    handler.throwIfCannotBeApplied(htlcRefundTransaction, lockWallet, walletRepository),
                ).rejects.toThrow(HtlcLockNotExpiredError);
            });
        });

        describe("throwIfCannotEnterPool", () => {
            it("should not throw", async () => {
                await expect(handler.throwIfCannotEnterPool(htlcRefundTransaction)).toResolve();
            });

            it("should throw if no wallet has a lock with associated transaction id", async () => {
                lockWallet.setAttribute("htlc.locks", {});

                await expect(handler.throwIfCannotEnterPool(htlcRefundTransaction)).rejects.toThrowError(
                    Contracts.TransactionPool.PoolError,
                );
            });

            it("should throw if refund transaction already in pool", async () => {
                const anotherHtlcRefundTransaction = crypto.TransactionManager.BuilderFactory.htlcRefund()
                    .htlcRefundAsset({
                        lockTransactionId: htlcLockTransaction.id!,
                    })
                    .nonce("1")
                    .sign(passphrases[2])
                    .build();

                await app.get<Mempool>(Identifiers.TransactionPoolMempool).addTransaction(anotherHtlcRefundTransaction);

                lockWallet.setAttribute(
                    "htlc.lockedBalance",
                    crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make(6 * 1e8),
                );

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
            it("should apply htlc refund transaction", async () => {
                await expect(
                    handler.throwIfCannotBeApplied(htlcRefundTransaction, lockWallet, walletRepository),
                ).toResolve();

                const balanceBefore = lockWallet.balance;

                // @ts-ignore
                expect(lockWallet.getAttribute("htlc.locks")[htlcLockTransaction.id]).toBeDefined();
                expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(htlcLockTransaction.data.amount);

                await handler.apply(htlcRefundTransaction, walletRepository);

                expect(lockWallet.getAttribute("htlc.locks")).toBeEmpty();
                expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(
                    crypto.CryptoManager.LibraryManager.Libraries.BigNumber.ZERO,
                );
                expect(lockWallet.balance).toEqual(
                    balanceBefore.plus(htlcLockTransaction.data.amount).minus(htlcRefundTransaction.data.fee),
                );
            });

            it("should apply htlc refund transaction defined as exception", async () => {
                // @ts-ignore
                const logSpy = jest.spyOn(handler.app.log, "warning");
                // @ts-ignore
                crypto.CryptoManager.LibraryManager.Utils.whitelistedBlockAndTransactionIds[
                    htlcRefundTransactionException.id
                ] = true;
                await expect(handler.apply(htlcRefundTransactionException, walletRepository)).toResolve();
                expect(logSpy).toHaveBeenCalledWith(
                    `Transaction forcibly applied as an exception: ${htlcRefundTransactionException.id}.`,
                );
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

                htlcRefundTransaction = crypto.TransactionManager.BuilderFactory.htlcRefund()
                    .htlcRefundAsset({
                        lockTransactionId: htlcLockTransaction.id!,
                    })
                    .nonce("1")
                    .sign(dummyPassphrase)
                    .build();

                await expect(
                    handler.throwIfCannotBeApplied(htlcRefundTransaction, dummyWallet, walletRepository),
                ).toResolve();

                const balanceBefore = lockWallet.balance;

                // @ts-ignore
                expect(lockWallet.getAttribute("htlc.locks")[htlcLockTransaction.id]).toBeDefined();
                expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(htlcLockTransaction.data.amount);

                await handler.apply(htlcRefundTransaction, walletRepository);

                expect(lockWallet.getAttribute("htlc.locks")).toBeEmpty();
                expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(
                    crypto.CryptoManager.LibraryManager.Libraries.BigNumber.ZERO,
                );
                expect(lockWallet.balance).toEqual(
                    balanceBefore.plus(htlcLockTransaction.data.amount).minus(htlcRefundTransaction.data.fee),
                );
            });
        });

        describe("revert", () => {
            it("should be ok", async () => {
                await expect(
                    handler.throwIfCannotBeApplied(htlcRefundTransaction, lockWallet, walletRepository),
                ).toResolve();

                Mocks.TransactionRepository.setTransactions([Mapper.mapTransactionToModel(htlcLockTransaction)]);
                const balanceBefore = lockWallet.balance;

                await handler.apply(htlcRefundTransaction, walletRepository);

                // @ts-ignore
                expect(lockWallet.getAttribute("htlc.locks")[htlcLockTransaction.id]).toBeUndefined();
                expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(
                    crypto.CryptoManager.LibraryManager.Libraries.BigNumber.ZERO,
                );
                expect(lockWallet.balance).toEqual(
                    balanceBefore.plus(htlcLockTransaction.data.amount).minus(htlcRefundTransaction.data.fee),
                );

                await handler.revert(htlcRefundTransaction, walletRepository);

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
                expect(foundLockWallet.balance).toEqual(balanceBefore);
            });

            it("should be ok if lcok transaction has vendor field", async () => {
                htlcLockTransaction.data.vendorField = "dummy";

                await expect(
                    handler.throwIfCannotBeApplied(htlcRefundTransaction, lockWallet, walletRepository),
                ).toResolve();

                Mocks.TransactionRepository.setTransactions([Mapper.mapTransactionToModel(htlcLockTransaction)]);
                const balanceBefore = lockWallet.balance;

                await handler.apply(htlcRefundTransaction, walletRepository);

                // @ts-ignore
                expect(lockWallet.getAttribute("htlc.locks")[htlcLockTransaction.id]).toBeUndefined();
                expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(
                    crypto.CryptoManager.LibraryManager.Libraries.BigNumber.ZERO,
                );
                expect(lockWallet.balance).toEqual(
                    balanceBefore.plus(htlcLockTransaction.data.amount).minus(htlcRefundTransaction.data.fee),
                );

                await handler.revert(htlcRefundTransaction, walletRepository);

                const foundLockWallet = walletRepository.findByIndex(
                    Contracts.State.WalletIndexes.Locks,
                    htlcLockTransaction.id!,
                );
                expect(foundLockWallet).toBeDefined();

                expect(foundLockWallet.getAttribute("htlc.lockedBalance")).toEqual(htlcLockTransaction.data.amount);
                expect(foundLockWallet.balance).toEqual(balanceBefore);
            });
        });
    });
});
