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
import {
    HtlcLockExpiredError,
    HtlcLockTransactionNotFoundError,
    HtlcSecretHashMismatchError,
} from "@packages/core-transactions/src/errors";
import { TransactionHandler } from "@packages/core-transactions/src/handlers";
import { TransactionHandlerRegistry } from "@packages/core-transactions/src/handlers/handler-registry";
import { Crypto, Enums, Interfaces, Managers, Transactions, Utils } from "@packages/crypto";
import { BuilderFactory } from "@packages/crypto/dist/transactions";
import { configManager } from "@packages/crypto/src/managers";

import { htlcSecretHashHex, htlcSecretHex } from "../__fixtures__/htlc-secrets";
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

describe("Htlc claim", () => {
    describe.each([EpochTimestamp, BlockHeight])("Htlc claim - expiration type %i", (expirationType) => {
        let htlcLockTransaction: Interfaces.ITransaction;
        let htlcClaimTransaction: Interfaces.ITransaction;
        let secondSignHtlcClaimTransaction: Interfaces.ITransaction;
        let multiSignHtlcClaimTransaction: Interfaces.ITransaction;
        let handler: TransactionHandler;
        let lockWallet: Wallets.Wallet;
        let claimWallet: Wallets.Wallet;

        const lockPassphrase = passphrases[2];
        const claimPassphrase = passphrases[3];

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

            htlcLockTransaction = BuilderFactory.htlcLock()
                .htlcLockAsset({
                    secretHash: htlcSecretHashHex,
                    expiration: expiration,
                })
                .recipientId(claimWallet.getAddress())
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

            htlcClaimTransaction = BuilderFactory.htlcClaim()
                .htlcClaimAsset({
                    unlockSecret: htlcSecretHex,
                    lockTransactionId: htlcLockTransaction.id!,
                })
                .nonce("1")
                .sign(claimPassphrase)
                .build();

            secondSignHtlcClaimTransaction = BuilderFactory.htlcClaim()
                .htlcClaimAsset({
                    unlockSecret: htlcSecretHex,
                    lockTransactionId: htlcLockTransaction.id!,
                })
                .nonce("1")
                .sign(passphrases[1])
                .secondSign(passphrases[2])
                .build();

            multiSignHtlcClaimTransaction = BuilderFactory.htlcClaim()
                .htlcClaimAsset({
                    unlockSecret: htlcSecretHex,
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
                        transaction: htlcLockTransaction,
                        addonBytes: 137,
                        satoshiPerByte: 3,
                        height: 1,
                    }),
                ).toBe(Utils.BigNumber.ZERO);
            });
        });

        describe("throwIfCannotBeApplied", () => {
            it("should not throw", async () => {
                await expect(handler.throwIfCannotBeApplied(htlcClaimTransaction, claimWallet)).toResolve();
            });

            it("should not throw - second sign", async () => {
                await expect(
                    handler.throwIfCannotBeApplied(secondSignHtlcClaimTransaction, secondSignatureWallet),
                ).toResolve();
            });

            it("should not throw - multi sign", async () => {
                await expect(
                    handler.throwIfCannotBeApplied(multiSignHtlcClaimTransaction, multiSignatureWallet),
                ).toResolve();
            });

            it("should throw if asset is undefined", async () => {
                htlcClaimTransaction.data.asset = undefined;

                await expect(handler.throwIfCannotBeApplied(htlcClaimTransaction, claimWallet)).rejects.toThrow(
                    Exceptions.Runtime.AssertionException,
                );
            });

            it("should throw if asset.claim is undefined", async () => {
                htlcClaimTransaction.data.asset!.claim = undefined;

                await expect(handler.throwIfCannotBeApplied(htlcClaimTransaction, claimWallet)).rejects.toThrow(
                    Exceptions.Runtime.AssertionException,
                );
            });

            it("should throw if no wallet has a lock with associated transaction id", async () => {
                lockWallet.setAttribute("htlc.locks", {});

                await expect(handler.throwIfCannotBeApplied(htlcClaimTransaction, claimWallet)).rejects.toThrow(
                    HtlcLockTransactionNotFoundError,
                );
            });

            it("should throw if secret hash does not match", async () => {
                htlcClaimTransaction = BuilderFactory.htlcClaim()
                    .htlcClaimAsset({
                        unlockSecret: "a".repeat(64),
                        lockTransactionId: htlcLockTransaction.id!,
                    })
                    .nonce("1")
                    .sign(claimPassphrase)
                    .build();

                await expect(handler.throwIfCannotBeApplied(htlcClaimTransaction, claimWallet)).rejects.toThrow(
                    HtlcSecretHashMismatchError,
                );
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

                htlcClaimTransaction = BuilderFactory.htlcClaim()
                    .htlcClaimAsset({
                        unlockSecret: htlcSecretHex,
                        lockTransactionId: htlcLockTransaction.id!,
                    })
                    .sign(dummyPassphrase)
                    .nonce("1")
                    .build();

                await expect(handler.throwIfCannotBeApplied(htlcClaimTransaction, dummyWallet)).toResolve();
            });

            it("should throw if lock expired", async () => {
                const amount = 1e9;
                const expiration = {
                    type: expirationType,
                    value: makeExpiredTimestamp(expirationType),
                };

                htlcLockTransaction = BuilderFactory.htlcLock()
                    .htlcLockAsset({
                        secretHash: htlcSecretHashHex,
                        expiration: expiration,
                    })
                    .recipientId(claimWallet.getAddress())
                    .amount(amount.toString())
                    .nonce("1")
                    .vendorField("dummy")
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

                htlcClaimTransaction = BuilderFactory.htlcClaim()
                    .htlcClaimAsset({
                        unlockSecret: htlcSecretHex,
                        lockTransactionId: htlcLockTransaction.id!,
                    })
                    .sign(claimPassphrase)
                    .nonce("1")
                    .build();

                await expect(handler.throwIfCannotBeApplied(htlcClaimTransaction, claimWallet)).rejects.toThrow(
                    HtlcLockExpiredError,
                );
            });
        });

        describe("throwIfCannotEnterPool", () => {
            it("should not throw", async () => {
                await expect(handler.throwIfCannotEnterPool(htlcClaimTransaction)).toResolve();
            });

            it("should throw if asset is undefined", async () => {
                htlcClaimTransaction.data.asset = undefined;

                await expect(handler.throwIfCannotEnterPool(htlcClaimTransaction)).rejects.toThrow(
                    Exceptions.Runtime.AssertionException,
                );
            });

            it("should throw if asset.claim is undefined", async () => {
                htlcClaimTransaction.data.asset!.claim = undefined;

                await expect(handler.throwIfCannotEnterPool(htlcClaimTransaction)).rejects.toThrow(
                    Exceptions.Runtime.AssertionException,
                );
            });

            it("should throw if no wallet has a lock with associated transaction id", async () => {
                lockWallet.setAttribute("htlc.locks", {});

                await expect(handler.throwIfCannotEnterPool(htlcClaimTransaction)).rejects.toThrow(
                    Contracts.TransactionPool.PoolError,
                );
            });

            it("should throw if transaction by sender already in pool", async () => {
                await app.get<Mempool>(Identifiers.TransactionPoolMempool).addTransaction(htlcClaimTransaction);

                lockWallet.setAttribute("htlc.lockedBalance", Utils.BigNumber.make(6 * 1e8));

                lockWallet.setAttribute("htlc.locks", {
                    [htlcLockTransaction.id!]: {
                        amount: htlcLockTransaction.data.amount,
                        recipientId: htlcLockTransaction.data.recipientId,
                        ...htlcLockTransaction.data.asset!.lock,
                    },
                });
                walletRepository.index(lockWallet);

                await expect(handler.throwIfCannotEnterPool(htlcClaimTransaction)).rejects.toThrow(
                    Contracts.TransactionPool.PoolError,
                );
            });

            it("should throw if transaction already in pool", async () => {
                const anotherHtlcClaimTransaction = BuilderFactory.htlcClaim()
                    .htlcClaimAsset({
                        unlockSecret: htlcSecretHex,
                        lockTransactionId: htlcLockTransaction.id!,
                    })
                    .nonce("1")
                    .sign(passphrases[2])
                    .build();

                await app.get<Mempool>(Identifiers.TransactionPoolMempool).addTransaction(anotherHtlcClaimTransaction);

                lockWallet.setAttribute("htlc.lockedBalance", Utils.BigNumber.make(6 * 1e8));

                lockWallet.setAttribute("htlc.locks", {
                    [htlcLockTransaction.id!]: {
                        amount: htlcLockTransaction.data.amount,
                        recipientId: htlcLockTransaction.data.recipientId,
                        ...htlcLockTransaction.data.asset!.lock,
                    },
                });
                walletRepository.index(lockWallet);

                await expect(handler.throwIfCannotEnterPool(htlcClaimTransaction)).rejects.toThrow(
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

            it("should apply htlc claim transaction", async () => {
                await expect(handler.throwIfCannotBeApplied(htlcClaimTransaction, claimWallet)).toResolve();

                const balanceBefore = claimWallet.getBalance();

                expect(lockWallet.getAttribute("htlc.locks")).toBeDefined();
                expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(htlcLockTransaction.data.amount);

                await handler.apply(htlcClaimTransaction);

                expect(lockWallet.hasAttribute("htlc")).toBe(false);
                expect(claimWallet.getBalance()).toEqual(
                    balanceBefore.plus(htlcLockTransaction.data.amount).minus(htlcClaimTransaction.data.fee),
                );
            });

            it("should apply htlc claim transaction defined as exception", async () => {
                configManager.set("network.pubKeyHash", 99);
                configManager.set("exceptions.transactions", [htlcClaimTransaction.id]);

                expect(handler.apply(htlcClaimTransaction)).toResolve();
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

                htlcClaimTransaction = BuilderFactory.htlcClaim()
                    .htlcClaimAsset({
                        unlockSecret: htlcSecretHex,
                        lockTransactionId: htlcLockTransaction.id!,
                    })
                    .sign(dummyPassphrase)
                    .nonce("1")
                    .build();

                await expect(handler.throwIfCannotBeApplied(htlcClaimTransaction, dummyWallet)).toResolve();

                const balanceBefore = claimWallet.getBalance();

                expect(lockWallet.getAttribute("htlc.locks")).not.toBeEmpty();
                expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(htlcLockTransaction.data.amount);

                await handler.apply(htlcClaimTransaction);

                expect(lockWallet.hasAttribute("htlc")).toBe(false);
                expect(claimWallet.getBalance()).toEqual(
                    balanceBefore.plus(htlcLockTransaction.data.amount).minus(htlcClaimTransaction.data.fee),
                );
            });
        });

        describe("applyToSender", () => {
            it("should apply", async () => {
                expect(handler.applyToSender(htlcClaimTransaction)).toResolve();
            });

            it("should throw if asset is undefined", async () => {
                htlcClaimTransaction.data.asset = undefined;

                handler.throwIfCannotBeApplied = jest.fn();

                await expect(handler.applyToSender(htlcClaimTransaction)).rejects.toThrow(
                    Exceptions.Runtime.AssertionException,
                );
            });

            it("should throw if asset.claim is undefined", async () => {
                htlcClaimTransaction.data.asset!.claim = undefined;

                handler.throwIfCannotBeApplied = jest.fn();

                await expect(handler.applyToSender(htlcClaimTransaction)).rejects.toThrow(
                    Exceptions.Runtime.AssertionException,
                );
            });
        });

        describe("revert", () => {
            it("should be ok", async () => {
                await expect(handler.throwIfCannotBeApplied(htlcClaimTransaction, claimWallet)).toResolve();

                Mocks.TransactionRepository.setTransactions([Mapper.mapTransactionToModel(htlcLockTransaction)]);

                const balanceBefore = claimWallet.getBalance();

                await handler.apply(htlcClaimTransaction);

                expect(lockWallet.hasAttribute("htlc")).toBe(false);
                expect(claimWallet.getBalance()).toEqual(
                    balanceBefore.plus(htlcLockTransaction.data.amount).minus(htlcClaimTransaction.data.fee),
                );

                await handler.revert(htlcClaimTransaction);

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
                expect(claimWallet.getBalance()).toEqual(balanceBefore);
            });

            it("should be ok if lockWallet contains another locks", async () => {
                await expect(handler.throwIfCannotBeApplied(htlcClaimTransaction, claimWallet)).toResolve();

                Mocks.TransactionRepository.setTransactions([Mapper.mapTransactionToModel(htlcLockTransaction)]);

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

                const balanceBefore = claimWallet.getBalance();
                await handler.apply(htlcClaimTransaction);

                expect(lockWallet.hasAttribute("htlc.locks")).toBeTrue();
                expect(claimWallet.getBalance()).toEqual(
                    balanceBefore.plus(htlcLockTransaction.data.amount).minus(htlcClaimTransaction.data.fee),
                );

                await handler.revert(htlcClaimTransaction);

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

                expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(
                    htlcLockTransaction.data.amount.plus(amount),
                );
                expect(claimWallet.getBalance()).toEqual(balanceBefore);
            });

            it("should be ok if lock transaction has vendorField", async () => {
                htlcLockTransaction.data.vendorField = "dummy";

                await expect(handler.throwIfCannotBeApplied(htlcClaimTransaction, claimWallet)).toResolve();

                Mocks.TransactionRepository.setTransactions([Mapper.mapTransactionToModel(htlcLockTransaction)]);

                const balanceBefore = claimWallet.getBalance();

                await handler.apply(htlcClaimTransaction);

                expect(lockWallet.hasAttribute("htlc")).toBe(false);
                expect(claimWallet.getBalance()).toEqual(
                    balanceBefore.plus(htlcLockTransaction.data.amount).minus(htlcClaimTransaction.data.fee),
                );

                await handler.revert(htlcClaimTransaction);

                const foundLockWallet = walletRepository.findByIndex(
                    Contracts.State.WalletIndexes.Locks,
                    htlcLockTransaction.id!,
                );

                expect(foundLockWallet).toBeDefined();

                expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(htlcLockTransaction.data.amount);
                expect(claimWallet.getBalance()).toEqual(balanceBefore);
            });
        });

        describe("revertForSender", () => {
            beforeEach(() => {
                Mocks.TransactionRepository.setTransactions([Mapper.mapTransactionToModel(htlcLockTransaction)]);
            });

            it("should revert", async () => {
                await expect(handler.applyToSender(htlcClaimTransaction)).toResolve();
                await expect(handler.revertForSender(htlcClaimTransaction)).toResolve();
            });

            it("should throw if asset is undefined", async () => {
                await expect(handler.apply(htlcClaimTransaction)).toResolve();

                htlcClaimTransaction.data.asset = undefined;
                claimWallet.setNonce(Utils.BigNumber.ONE);

                await expect(handler.revertForSender(htlcClaimTransaction)).rejects.toThrow(
                    Exceptions.Runtime.AssertionException,
                );
            });

            it("should throw if asset.claim is undefined", async () => {
                await expect(handler.apply(htlcClaimTransaction)).toResolve();

                htlcClaimTransaction.data.asset!.claim = undefined;

                await expect(handler.revertForSender(htlcClaimTransaction)).rejects.toThrow(
                    Exceptions.Runtime.AssertionException,
                );
            });

            it("should throw if lockedTransaction.asset is undefined", async () => {
                await expect(handler.apply(htlcClaimTransaction)).toResolve();

                htlcLockTransaction.data.asset = undefined;
                Mocks.TransactionRepository.setTransactions([Mapper.mapTransactionToModel(htlcLockTransaction)]);

                await expect(handler.revertForSender(htlcClaimTransaction)).rejects.toThrow(
                    Exceptions.Runtime.AssertionException,
                );
            });
        });
    });
});
