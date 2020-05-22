import "jest-extended";

import { htlcSecretHashHex, htlcSecretHex } from "../__fixtures__/htlc-secrets";
import {
    buildMultiSignatureWallet,
    buildRecipientWallet,
    buildSecondSignatureWallet,
    buildSenderWallet,
    initApp,
} from "../__support__/app";
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
import {
    HtlcLockExpiredError,
    HtlcLockTransactionNotFoundError,
    HtlcSecretHashMismatchError,
} from "@packages/core-transactions/src/errors";
import { TransactionHandler } from "@packages/core-transactions/src/handlers";
import { TransactionHandlerRegistry } from "@packages/core-transactions/src/handlers/handler-registry";
import { Enums, Interfaces, Transactions } from "@packages/crypto";

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
        exceptions: {
            transactions: ["4d48d9bc6057a80b73e4813cb3defa37bb7aeae49968739d91436b37e9cd4ed8"],
        },
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

describe("Htlc claim", () => {
    describe.each([EpochTimestamp, BlockHeight])("Htlc claim - expiration type %i", (expirationType) => {
        let htlcLockTransaction: Interfaces.ITransaction;
        let htlcClaimTransaction: Interfaces.ITransaction;
        let secondSignHtlcClaimTransaction: Interfaces.ITransaction;
        let multiSignHtlcClaimTransaction: Interfaces.ITransaction;
        let htlcClaimTransactionException: Interfaces.ITransaction;
        let handler: TransactionHandler;
        let lockWallet: Wallets.Wallet;
        let claimWallet: Wallets.Wallet;

        const lockPassphrase = passphrases[2];
        const claimPassphrase = passphrases[3];

        const amount = 6 * 1e8;

        beforeEach(async () => {
            const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(
                Identifiers.TransactionHandlerRegistry,
            );
            handler = transactionHandlerRegistry.getRegisteredHandlerByType(
                Transactions.InternalTransactionType.from(
                    Enums.TransactionType.HtlcClaim,
                    Enums.TransactionTypeGroup.Core,
                ),
                2,
            );

            claimWallet = factoryBuilder
                .get("Wallet")
                .withOptions({
                    passphrase: claimPassphrase,
                    nonce: 0,
                })
                .make();

            lockWallet = factoryBuilder
                .get("Wallet")
                .withOptions({
                    passphrase: lockPassphrase,
                    nonce: 0,
                })
                .make();

            walletRepository.index(lockWallet);
            walletRepository.index(claimWallet);

            const expiration = {
                type: expirationType,
                value: makeNotExpiredTimestamp(expirationType),
            };

            htlcLockTransaction = crypto.TransactionManager.BuilderFactory.htlcLock()
                .htlcLockAsset({
                    secretHash: htlcSecretHashHex,
                    expiration: expiration,
                })
                .recipientId(claimWallet.address)
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

            htlcClaimTransaction = crypto.TransactionManager.BuilderFactory.htlcClaim()
                .htlcClaimAsset({
                    unlockSecret: htlcSecretHex,
                    lockTransactionId: htlcLockTransaction.id!,
                })
                .nonce("1")
                .sign(claimPassphrase)
                .build();

            htlcClaimTransactionException = crypto.TransactionManager.BuilderFactory.htlcClaim()
                .htlcClaimAsset({
                    unlockSecret: htlcSecretHex,
                    lockTransactionId: htlcLockTransaction.id!,
                })
                .nonce("1")
                .sign("other")
                .build();

            secondSignHtlcClaimTransaction = crypto.TransactionManager.BuilderFactory.htlcClaim()
                .htlcClaimAsset({
                    unlockSecret: htlcSecretHex,
                    lockTransactionId: htlcLockTransaction.id!,
                })
                .nonce("1")
                .sign(passphrases[1])
                .secondSign(passphrases[2])
                .build();

            multiSignHtlcClaimTransaction = crypto.TransactionManager.BuilderFactory.htlcClaim()
                .htlcClaimAsset({
                    unlockSecret: htlcSecretHex,
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
                        transaction: htlcLockTransaction,
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
                    handler.throwIfCannotBeApplied(htlcClaimTransaction, claimWallet, walletRepository),
                ).toResolve();
            });

            it("should not throw - second sign", async () => {
                await expect(
                    handler.throwIfCannotBeApplied(
                        secondSignHtlcClaimTransaction,
                        secondSignatureWallet,
                        walletRepository,
                    ),
                ).toResolve();
            });

            it("should not throw - multi sign", async () => {
                await expect(
                    handler.throwIfCannotBeApplied(
                        multiSignHtlcClaimTransaction,
                        multiSignatureWallet,
                        walletRepository,
                    ),
                ).toResolve();
            });

            it("should throw if no wallet has a lock with associated transaction id", async () => {
                lockWallet.setAttribute("htlc.locks", {});

                await expect(
                    handler.throwIfCannotBeApplied(htlcClaimTransaction, claimWallet, walletRepository),
                ).rejects.toThrow(HtlcLockTransactionNotFoundError);
            });

            it("should throw if secret hash does not match", async () => {
                htlcClaimTransaction = crypto.TransactionManager.BuilderFactory.htlcClaim()
                    .htlcClaimAsset({
                        unlockSecret: "a".repeat(64),
                        lockTransactionId: htlcLockTransaction.id!,
                    })
                    .nonce("1")
                    .sign(claimPassphrase)
                    .build();

                await expect(
                    handler.throwIfCannotBeApplied(htlcClaimTransaction, claimWallet, walletRepository),
                ).rejects.toThrow(HtlcSecretHashMismatchError);
            });

            it("should not throw if claiming wallet is not recipient of lock transaction", async () => {
                const dummyPassphrase = "not recipient of lock";
                const dummyWallet: Wallets.Wallet = factoryBuilder
                    .get("Wallet")
                    .withOptions({
                        passphrase: dummyPassphrase,
                        nonce: 0,
                    })
                    .make();

                walletRepository.index(dummyWallet);

                htlcClaimTransaction = crypto.TransactionManager.BuilderFactory.htlcClaim()
                    .htlcClaimAsset({
                        unlockSecret: htlcSecretHex,
                        lockTransactionId: htlcLockTransaction.id!,
                    })
                    .sign(dummyPassphrase)
                    .nonce("1")
                    .build();

                await expect(
                    handler.throwIfCannotBeApplied(htlcClaimTransaction, dummyWallet, walletRepository),
                ).toResolve();
            });

            it("should throw if lock expired", async () => {
                const amount = 1e9;
                const expiration = {
                    type: expirationType,
                    value: makeExpiredTimestamp(expirationType),
                };

                htlcLockTransaction = crypto.TransactionManager.BuilderFactory.htlcLock()
                    .htlcLockAsset({
                        secretHash: htlcSecretHashHex,
                        expiration: expiration,
                    })
                    .recipientId(claimWallet.address)
                    .amount(amount.toString())
                    .nonce("1")
                    .vendorField("dummy")
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

                htlcClaimTransaction = crypto.TransactionManager.BuilderFactory.htlcClaim()
                    .htlcClaimAsset({
                        unlockSecret: htlcSecretHex,
                        lockTransactionId: htlcLockTransaction.id!,
                    })
                    .sign(claimPassphrase)
                    .nonce("1")
                    .build();

                await expect(
                    handler.throwIfCannotBeApplied(htlcClaimTransaction, claimWallet, walletRepository),
                ).rejects.toThrow(HtlcLockExpiredError);
            });
        });

        describe("throwIfCannotEnterPool", () => {
            it("should not throw", async () => {
                await expect(handler.throwIfCannotEnterPool(htlcClaimTransaction)).toResolve();
            });

            it("should throw if no wallet has a lock with associated transaction id", async () => {
                lockWallet.setAttribute("htlc.locks", {});

                await expect(handler.throwIfCannotEnterPool(htlcClaimTransaction)).rejects.toThrow(
                    Contracts.TransactionPool.PoolError,
                );
            });

            it("should throw if transaction by sender already in pool", async () => {
                await app.get<Mempool>(Identifiers.TransactionPoolMempool).addTransaction(htlcClaimTransaction);

                await expect(handler.throwIfCannotEnterPool(htlcClaimTransaction)).rejects.toThrow(
                    Contracts.TransactionPool.PoolError,
                );
            });

            it("should throw if transaction already in pool", async () => {
                const anotherHtlcClaimTransaction = crypto.TransactionManager.BuilderFactory.htlcClaim()
                    .htlcClaimAsset({
                        unlockSecret: htlcSecretHex,
                        lockTransactionId: htlcLockTransaction.id!,
                    })
                    .nonce("1")
                    .sign(passphrases[2])
                    .build();

                await app.get<Mempool>(Identifiers.TransactionPoolMempool).addTransaction(anotherHtlcClaimTransaction);

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

                await expect(handler.throwIfCannotEnterPool(htlcClaimTransaction)).rejects.toThrow(
                    Contracts.TransactionPool.PoolError,
                );
            });
        });

        describe("apply", () => {
            it("should apply htlc claim transaction", async () => {
                await expect(
                    handler.throwIfCannotBeApplied(htlcClaimTransaction, claimWallet, walletRepository),
                ).toResolve();

                const balanceBefore = claimWallet.balance;

                expect(lockWallet.getAttribute("htlc.locks")).toBeDefined();
                expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(htlcLockTransaction.data.amount);

                await handler.apply(htlcClaimTransaction, walletRepository);

                expect(lockWallet.getAttribute("htlc.locks")).toBeEmpty();
                expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(
                    crypto.CryptoManager.LibraryManager.Libraries.BigNumber.ZERO,
                );
                expect(claimWallet.balance).toEqual(
                    balanceBefore.plus(htlcLockTransaction.data.amount).minus(htlcClaimTransaction.data.fee),
                );
            });

            it("should apply htlc claim transaction defined as exception", async () => {
                expect(handler.apply(htlcClaimTransactionException, walletRepository)).toResolve();
            });

            it("should apply htlc claim transaction - when sender is not claim wallet", async () => {
                const dummyPassphrase = "not recipient of lock";
                const dummyWallet: Wallets.Wallet = factoryBuilder
                    .get("Wallet")
                    .withOptions({
                        passphrase: dummyPassphrase,
                        nonce: 0,
                    })
                    .make();

                walletRepository.index(dummyWallet);

                htlcClaimTransaction = crypto.TransactionManager.BuilderFactory.htlcClaim()
                    .htlcClaimAsset({
                        unlockSecret: htlcSecretHex,
                        lockTransactionId: htlcLockTransaction.id!,
                    })
                    .sign(dummyPassphrase)
                    .nonce("1")
                    .build();

                await expect(
                    handler.throwIfCannotBeApplied(htlcClaimTransaction, dummyWallet, walletRepository),
                ).toResolve();

                const balanceBefore = claimWallet.balance;

                expect(lockWallet.getAttribute("htlc.locks")).not.toBeEmpty();
                expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(htlcLockTransaction.data.amount);

                await handler.apply(htlcClaimTransaction, walletRepository);

                expect(lockWallet.getAttribute("htlc.locks")).toBeEmpty();
                expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(
                    crypto.CryptoManager.LibraryManager.Libraries.BigNumber.ZERO,
                );
                expect(claimWallet.balance).toEqual(
                    balanceBefore.plus(htlcLockTransaction.data.amount).minus(htlcClaimTransaction.data.fee),
                );
            });
        });

        describe("revert", () => {
            it("should be ok", async () => {
                await expect(
                    handler.throwIfCannotBeApplied(htlcClaimTransaction, claimWallet, walletRepository),
                ).toResolve();

                Mocks.TransactionRepository.setTransactions([Mapper.mapTransactionToModel(htlcLockTransaction)]);

                const balanceBefore = claimWallet.balance;

                await handler.apply(htlcClaimTransaction, walletRepository);

                expect(lockWallet.getAttribute("htlc.locks")).toBeEmpty();
                expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(
                    crypto.CryptoManager.LibraryManager.Libraries.BigNumber.ZERO,
                );
                expect(claimWallet.balance).toEqual(
                    balanceBefore.plus(htlcLockTransaction.data.amount).minus(htlcClaimTransaction.data.fee),
                );

                await handler.revert(htlcClaimTransaction, walletRepository);

                const foundLockWallet = walletRepository.findByIndex(
                    Contracts.State.WalletIndexes.Locks,
                    htlcLockTransaction.id!,
                );

                expect(foundLockWallet).toBeDefined();
                // @ts-ignore
                expect(lockWallet.getAttribute("htlc.locks")[htlcLockTransaction.id]).toEqual({
                    amount: htlcLockTransaction.data.amount,
                    recipientId: htlcLockTransaction.data.recipientId,
                    ...htlcLockTransaction.data.asset!.lock,
                });

                expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(htlcLockTransaction.data.amount);
                expect(claimWallet.balance).toEqual(balanceBefore);
            });

            it("should be ok if lock transaction has vendorField", async () => {
                htlcLockTransaction.data.vendorField = "dummy";

                await expect(
                    handler.throwIfCannotBeApplied(htlcClaimTransaction, claimWallet, walletRepository),
                ).toResolve();

                Mocks.TransactionRepository.setTransactions([Mapper.mapTransactionToModel(htlcLockTransaction)]);

                const balanceBefore = claimWallet.balance;

                await handler.apply(htlcClaimTransaction, walletRepository);

                expect(lockWallet.getAttribute("htlc.locks")).toBeEmpty();
                expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(
                    crypto.CryptoManager.LibraryManager.Libraries.BigNumber.ZERO,
                );
                expect(claimWallet.balance).toEqual(
                    balanceBefore.plus(htlcLockTransaction.data.amount).minus(htlcClaimTransaction.data.fee),
                );

                await handler.revert(htlcClaimTransaction, walletRepository);

                const foundLockWallet = walletRepository.findByIndex(
                    Contracts.State.WalletIndexes.Locks,
                    htlcLockTransaction.id!,
                );

                expect(foundLockWallet).toBeDefined();

                expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(htlcLockTransaction.data.amount);
                expect(claimWallet.balance).toEqual(balanceBefore);
            });
        });
    });
});
