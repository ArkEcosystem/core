import "jest-extended";

import passphrases from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { BuilderFactory } from "@arkecosystem/crypto/src/transactions";
import { Application, Contracts } from "@arkecosystem/core-kernel";
import { Crypto, Enums, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { Factories, FactoryBuilder } from "@arkecosystem/core-test-framework/src/factories";
import { Generators } from "@arkecosystem/core-test-framework/src";
import { Identifiers } from "@arkecosystem/core-kernel/src/ioc";
import { Memory } from "@arkecosystem/core-transaction-pool/src/memory";
import { StateStore } from "@arkecosystem/core-state/src/stores/state";
import { TransactionHandler } from "@arkecosystem/core-transactions/src/handlers";
import { TransactionHandlerRegistry } from "@arkecosystem/core-transactions/src/handlers/handler-registry";
import { Wallets } from "@arkecosystem/core-state";
import { configManager } from "@packages/crypto/src/managers";
import {
    HtlcLockExpiredError,
    HtlcLockTransactionNotFoundError,
    HtlcSecretHashMismatchError,
} from "@arkecosystem/core-transactions/src/errors";
import { setMockTransaction } from "../__mocks__/transaction-repository";
import {
    buildMultiSignatureWallet,
    buildRecipientWallet,
    buildSecondSignatureWallet,
    buildSenderWallet,
    initApp,
} from "../__support__/app";
import { htlcSecretHashHex, htlcSecretHex } from "../__fixtures__/htlc-secrets";

let app: Application;
let senderWallet: Wallets.Wallet;
let secondSignatureWallet: Wallets.Wallet;
let multiSignatureWallet: Wallets.Wallet;
let recipientWallet: Wallets.Wallet;
let walletRepository: Contracts.State.WalletRepository;
let factoryBuilder: FactoryBuilder;

const { EpochTimestamp, BlockHeight } = Enums.HtlcLockExpirationType;

const mockLastBlockData: Partial<Interfaces.IBlockData> = { timestamp: Crypto.Slots.getTime() , height: 4 };

const makeBlockHeightTimestamp = (heightRelativeToLastBlock = 2) =>
    mockLastBlockData.height! + heightRelativeToLastBlock;
const makeExpiredTimestamp = type =>
    type === EpochTimestamp ? mockLastBlockData.timestamp! - 9 : makeBlockHeightTimestamp(-2);
const makeNotExpiredTimestamp = type =>
    type === EpochTimestamp ? mockLastBlockData.timestamp! + 999 : makeBlockHeightTimestamp(9);

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

    walletRepository.index(senderWallet);
    walletRepository.index(secondSignatureWallet);
    walletRepository.index(multiSignatureWallet);
    walletRepository.index(recipientWallet);
});

describe("Htlc claim", () => {
    describe.each([EpochTimestamp, BlockHeight])("Htlc claim - expiration type %i", expirationType => {
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
            const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);
            handler = transactionHandlerRegistry.getRegisteredHandlerByType(Transactions.InternalTransactionType.from(Enums.TransactionType.HtlcClaim, Enums.TransactionTypeGroup.Core), 2);

            claimWallet = factoryBuilder
                .get("Wallet")
                .withOptions({
                    passphrase: claimPassphrase,
                    nonce: 0
                })
                .make();

            lockWallet = factoryBuilder
                .get("Wallet")
                .withOptions({
                    passphrase: lockPassphrase,
                    nonce: 0
                })
                .make();

            walletRepository.index(lockWallet);
            walletRepository.index(claimWallet);

            let expiration = {
                type: expirationType,
                value: makeNotExpiredTimestamp(expirationType),
            };

            htlcLockTransaction = BuilderFactory.htlcLock()
                .htlcLockAsset({
                    secretHash: htlcSecretHashHex,
                    expiration: expiration
                })
                .recipientId(claimWallet.address)
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
                .senderPublicKey(multiSignatureWallet.publicKey!)
                .multiSign(passphrases[0], 0)
                .multiSign(passphrases[1], 1)
                .multiSign(passphrases[2], 2)
                .build();
        });

        describe("bootstrap", () => {
            it("should resolve", async () => {
                setMockTransaction(htlcLockTransaction);
                await expect(handler.bootstrap()).toResolve();
            })
        });

        describe("dynamicFees", () => {
            it("should be zero", async () => {
                expect(handler.dynamicFee({ transaction: htlcLockTransaction, addonBytes: 137, satoshiPerByte: 3, height: 1  })).toBe(Utils.BigNumber.ZERO);
            })
        });

        describe("throwIfCannotBeApplied", () => {
            it("should not throw", async () => {
                await expect(handler.throwIfCannotBeApplied(htlcClaimTransaction, claimWallet, walletRepository)).toResolve();
            });

            it("should not throw - second sign", async () => {
                await expect(handler.throwIfCannotBeApplied(secondSignHtlcClaimTransaction, secondSignatureWallet, walletRepository)).toResolve();
            });

            it("should not throw - multi sign", async () => {
                await expect(handler.throwIfCannotBeApplied(multiSignHtlcClaimTransaction, multiSignatureWallet, walletRepository)).toResolve();
            });

            it("should throw if no wallet has a lock with associated transaction id", async () => {
                lockWallet.setAttribute("htlc.locks", {});

                await expect(handler.throwIfCannotBeApplied(htlcClaimTransaction, claimWallet, walletRepository)).rejects.toThrow(
                    HtlcLockTransactionNotFoundError,
                );
            });

            it("should throw if secret hash does not match", async () => {
                htlcClaimTransaction = BuilderFactory.htlcClaim()
                    .htlcClaimAsset({
                        unlockSecret: "a".repeat(64),
                        lockTransactionId: htlcLockTransaction.id!
                    })
                    .nonce("1")
                    .sign(claimPassphrase)
                    .build();

                await expect(handler.throwIfCannotBeApplied(htlcClaimTransaction, claimWallet, walletRepository)).rejects.toThrow(
                    HtlcSecretHashMismatchError,
                );
            });

            it("should not throw if claiming wallet is not recipient of lock transaction", async () => {
                const dummyPassphrase = "not recipient of lock";
                const dummyWallet: Wallets.Wallet = factoryBuilder
                    .get("Wallet")
                    .withOptions({
                        passphrase: dummyPassphrase,
                        nonce: 0
                    })
                    .make();

                walletRepository.index(dummyWallet);

                htlcClaimTransaction = BuilderFactory.htlcClaim()
                    .htlcClaimAsset({
                        unlockSecret: htlcSecretHex,
                        lockTransactionId: htlcLockTransaction.id!
                    })
                    .sign(dummyPassphrase)
                    .nonce("1")
                    .build();

                await expect(handler.throwIfCannotBeApplied(htlcClaimTransaction, dummyWallet, walletRepository)).toResolve();
            });

            it("should throw if lock expired", async () => {
                const amount = 1e9;
                let expiration = {
                    type: expirationType,
                    value: makeExpiredTimestamp(expirationType),
                };

                htlcLockTransaction = BuilderFactory.htlcLock()
                    .htlcLockAsset({
                        secretHash: htlcSecretHashHex,
                        expiration: expiration
                    })
                    .recipientId(claimWallet.address)
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
                        lockTransactionId: htlcLockTransaction.id!
                    })
                    .sign(claimPassphrase)
                    .nonce("1")
                    .build();

                await expect(handler.throwIfCannotBeApplied(htlcClaimTransaction, claimWallet, walletRepository)).rejects.toThrow(
                    HtlcLockExpiredError,
                );
            });
        });

        describe("throwIfCannotEnterPool", () => {
            it("should not throw", async () => {
                await expect(
                    handler.throwIfCannotEnterPool(
                        htlcClaimTransaction
                    ),
                ).toResolve();
            });

            it("should throw if no wallet has a lock with associated transaction id", async () => {
                lockWallet.setAttribute("htlc.locks", {});

                await expect(handler.throwIfCannotEnterPool(htlcClaimTransaction)).rejects.toThrow(Contracts.TransactionPool.PoolError);
            });

            it("should throw if transaction by sender already in pool", async () => {
                await app.get<Memory>(Identifiers.TransactionPoolMemory).addTransaction(htlcClaimTransaction);

                await expect(handler.throwIfCannotEnterPool(htlcClaimTransaction)).rejects.toThrow(Contracts.TransactionPool.PoolError);
            });

            it("should throw if transaction already in pool", async () => {
                let anotherHtlcClaimTransaction = BuilderFactory.htlcClaim()
                    .htlcClaimAsset({
                        unlockSecret: htlcSecretHex,
                        lockTransactionId: htlcLockTransaction.id!,
                    })
                    .nonce("1")
                    .sign(passphrases[2])
                    .build();

                await app.get<Memory>(Identifiers.TransactionPoolMemory).addTransaction(anotherHtlcClaimTransaction);

                lockWallet.setAttribute("htlc.lockedBalance", Utils.BigNumber.make(6 * 1e8));

                lockWallet.setAttribute("htlc.locks", {
                    [htlcLockTransaction.id!]: {
                        amount: htlcLockTransaction.data.amount,
                        recipientId: htlcLockTransaction.data.recipientId,
                        ...htlcLockTransaction.data.asset!.lock,
                    },
                });

                await expect(handler.throwIfCannotEnterPool(htlcClaimTransaction)).rejects.toThrow(Contracts.TransactionPool.PoolError);
            });
        });

        describe("apply",  () => {
            let pubKeyHash: number;

            beforeEach(() => {
                pubKeyHash = configManager.get("network.pubKeyHash");
            });

            afterEach(() => {
                configManager.set("exceptions.transactions", []);
                configManager.set("network.pubKeyHash", pubKeyHash);
            });

            it("should apply htlc claim transaction", async () => {
                await expect(handler.throwIfCannotBeApplied(htlcClaimTransaction, claimWallet, walletRepository)).toResolve();

                const balanceBefore = claimWallet.balance;

                expect(lockWallet.getAttribute("htlc.locks")).toBeDefined();
                expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(htlcLockTransaction.data.amount);

                await handler.apply(htlcClaimTransaction, walletRepository);

                expect(lockWallet.getAttribute("htlc.locks")).toBeEmpty();
                expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(Utils.BigNumber.ZERO);
                expect(claimWallet.balance).toEqual(balanceBefore.plus(htlcLockTransaction.data.amount).minus(htlcClaimTransaction.data.fee));
            });

            it("should apply htlc claim transaction defined as exception", async () => {
                configManager.set("network.pubKeyHash", 99);
                configManager.set("exceptions.transactions", [htlcClaimTransaction.id]);

                expect(handler.apply(htlcClaimTransaction, walletRepository)).toResolve()
            });

            it("should apply htlc claim transaction - when sender is not claim wallet", async () => {
                const dummyPassphrase = "not recipient of lock";
                const dummyWallet: Wallets.Wallet = factoryBuilder
                    .get("Wallet")
                    .withOptions({
                        passphrase: dummyPassphrase,
                        nonce: 0
                    })
                    .make();

                walletRepository.index(dummyWallet);

                htlcClaimTransaction = BuilderFactory.htlcClaim()
                    .htlcClaimAsset({
                        unlockSecret: htlcSecretHex,
                        lockTransactionId: htlcLockTransaction.id!
                    })
                    .sign(dummyPassphrase)
                    .nonce("1")
                    .build();

                await expect(handler.throwIfCannotBeApplied(htlcClaimTransaction, dummyWallet, walletRepository)).toResolve();

                const balanceBefore = claimWallet.balance;

                expect(lockWallet.getAttribute("htlc.locks")).not.toBeEmpty();
                expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(htlcLockTransaction.data.amount);

                await handler.apply(htlcClaimTransaction, walletRepository);

                expect(lockWallet.getAttribute("htlc.locks")).toBeEmpty();
                expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(Utils.BigNumber.ZERO);
                expect(claimWallet.balance).toEqual(balanceBefore.plus(htlcLockTransaction.data.amount).minus(htlcClaimTransaction.data.fee));
            });
        });

        describe("revert", () => {
            it("should be ok", async () => {
                await expect(handler.throwIfCannotBeApplied(htlcClaimTransaction, claimWallet, walletRepository)).toResolve();

                setMockTransaction(htlcLockTransaction);
                const balanceBefore = claimWallet.balance;

                await handler.apply(htlcClaimTransaction, walletRepository);

                expect(lockWallet.getAttribute("htlc.locks")).toBeEmpty();
                expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(Utils.BigNumber.ZERO);
                expect(claimWallet.balance).toEqual(balanceBefore.plus(htlcLockTransaction.data.amount).minus(htlcClaimTransaction.data.fee));

                await handler.revert(htlcClaimTransaction, walletRepository);

                let foundLockWallet = walletRepository.findByIndex(Contracts.State.WalletIndexes.Locks, htlcLockTransaction.id!);

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

                await expect(handler.throwIfCannotBeApplied(htlcClaimTransaction, claimWallet, walletRepository)).toResolve();

                setMockTransaction(htlcLockTransaction);
                const balanceBefore = claimWallet.balance;

                await handler.apply(htlcClaimTransaction, walletRepository);

                expect(lockWallet.getAttribute("htlc.locks")).toBeEmpty();
                expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(Utils.BigNumber.ZERO);
                expect(claimWallet.balance).toEqual(balanceBefore.plus(htlcLockTransaction.data.amount).minus(htlcClaimTransaction.data.fee));

                await handler.revert(htlcClaimTransaction, walletRepository);

                let foundLockWallet = walletRepository.findByIndex(Contracts.State.WalletIndexes.Locks, htlcLockTransaction.id!);

                expect(foundLockWallet).toBeDefined();

                expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(htlcLockTransaction.data.amount);
                expect(claimWallet.balance).toEqual(balanceBefore);
            });
        });
    });
});
