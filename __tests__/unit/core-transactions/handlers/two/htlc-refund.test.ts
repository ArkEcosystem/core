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
import { HtlcLockNotExpiredError, HtlcLockTransactionNotFoundError } from "@arkecosystem/core-transactions/src/errors";
import { setMockTransaction } from "../__mocks__/transaction-repository";
import {
    buildMultiSignatureWallet,
    buildRecipientWallet,
    buildSecondSignatureWallet,
    buildSenderWallet,
    initApp,
} from "../__support__/app";
import { htlcSecretHashHex } from "../__fixtures__/htlc-secrets";

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

    walletRepository.reindex(senderWallet);
    walletRepository.reindex(secondSignatureWallet);
    walletRepository.reindex(multiSignatureWallet);
    walletRepository.reindex(recipientWallet);
});

describe("Htlc refund", () => {
    describe.each([EpochTimestamp, BlockHeight])("Htlc refund - expiration type %i", expirationType => {
        const lockPassphrase = passphrases[2];
        let htlcLockTransaction: Interfaces.ITransaction;
        let htlcRefundTransaction: Interfaces.ITransaction;
        let secondSignatureHtlcRefundTransaction: Interfaces.ITransaction;
        let multiSignatureHtlcRefundTransaction: Interfaces.ITransaction;
        let handler: TransactionHandler;
        let lockWallet: Wallets.Wallet;

        beforeAll(() => {
            Managers.configManager.setFromPreset("testnet");
        });

        beforeEach(async () => {
            const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);
            handler = transactionHandlerRegistry.getRegisteredHandlerByType(Transactions.InternalTransactionType.from(Enums.TransactionType.HtlcRefund, Enums.TransactionTypeGroup.Core), 2);

            lockWallet = factoryBuilder
                .get("Wallet")
                .withOptions({
                    passphrase: lockPassphrase,
                    nonce: 0
                })
                .make();

            walletRepository.reindex(lockWallet);

            const amount = 6 * 1e8;
            let expiration = {
                type: expirationType,
                value: makeExpiredTimestamp(expirationType),
            };

            htlcLockTransaction = BuilderFactory.htlcLock()
                .htlcLockAsset({
                    secretHash: htlcSecretHashHex,
                    expiration: expiration
                })
                .recipientId(recipientWallet.address)
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

            walletRepository.reindex(lockWallet);

            htlcRefundTransaction = BuilderFactory.htlcRefund()
                .htlcRefundAsset({
                    lockTransactionId: htlcLockTransaction.id!
                })
                .nonce("1")
                .sign(lockPassphrase)
                .build();

            secondSignatureHtlcRefundTransaction = BuilderFactory.htlcRefund()
                .htlcRefundAsset({
                    lockTransactionId: htlcLockTransaction.id!
                })
                .nonce("1")
                .sign(passphrases[1])
                .secondSign(passphrases[2])
                .build();

            multiSignatureHtlcRefundTransaction = BuilderFactory.htlcRefund()
                .htlcRefundAsset({
                    lockTransactionId: htlcLockTransaction.id!
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
            });
        });

        describe("dynamicFees", () => {
            it("should be zero", async () => {
                expect(handler.dynamicFee({ transaction: htlcRefundTransaction, addonBytes: 137, satoshiPerByte: 3, height: 1  })).toBe(Utils.BigNumber.ZERO);
            })
        });

        describe("throwIfCannotBeApplied", () => {
            it("should not throw", async () => {
                await expect(handler.throwIfCannotBeApplied(htlcRefundTransaction, lockWallet, walletRepository)).toResolve();
            });

            it("should not throw - second sign", async () => {
                await expect(handler.throwIfCannotBeApplied(secondSignatureHtlcRefundTransaction, secondSignatureWallet, walletRepository)).toResolve();
            });

            it("should not throw - multi sign", async () => {
                await expect(handler.throwIfCannotBeApplied(multiSignatureHtlcRefundTransaction, multiSignatureWallet, walletRepository)).toResolve();
            });

            it("should throw if no wallet has a lock with associated transaction id", async () => {
                lockWallet.setAttribute("htlc.locks", {});

                await expect(handler.throwIfCannotBeApplied(htlcRefundTransaction, lockWallet, walletRepository)).rejects.toThrow(
                    HtlcLockTransactionNotFoundError,
                );
            });

            it("should not throw if refund wallet is not sender of lock transaction", async () => {
                const dummyPassphrase = "not recipient of lock";
                const dummyWallet: Wallets.Wallet = factoryBuilder
                    .get("Wallet")
                    .withOptions({
                        passphrase: dummyPassphrase,
                        nonce: 0
                    })
                    .make();

                walletRepository.reindex(dummyWallet);

                htlcRefundTransaction = BuilderFactory.htlcRefund()
                    .htlcRefundAsset({
                        lockTransactionId: htlcLockTransaction.id!
                    })
                    .nonce("1")
                    .sign(dummyPassphrase)
                    .build();

                await expect(handler.throwIfCannotBeApplied(htlcRefundTransaction, dummyWallet, walletRepository)).toResolve();
            });

            it("should throw if lock didn't expire - expiration type %i", async () => {
                const amount = 6 * 1e8;
                let expiration = {
                    type: expirationType,
                    value: makeNotExpiredTimestamp(expirationType),
                };

                htlcLockTransaction = BuilderFactory.htlcLock()
                    .htlcLockAsset({
                        secretHash: htlcSecretHashHex,
                        expiration: expiration
                    })
                    .recipientId(recipientWallet.address)
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

                walletRepository.reindex(lockWallet);

                htlcRefundTransaction = BuilderFactory.htlcRefund()
                    .htlcRefundAsset({
                        lockTransactionId: htlcLockTransaction.id!
                    })
                    .nonce("1")
                    .sign(lockPassphrase)
                    .build();


                await expect(handler.throwIfCannotBeApplied(htlcRefundTransaction, lockWallet, walletRepository
                )).rejects.toThrow(
                    HtlcLockNotExpiredError,
                );
            });
        });

        describe("throwIfCannotEnterPool", () => {
            it("should not throw", async () => {
                await expect(
                    handler.throwIfCannotEnterPool(
                        htlcRefundTransaction
                    ),
                ).toResolve();
            });

            it("should throw if no wallet has a lock with associated transaction id", async () => {
                lockWallet.setAttribute("htlc.locks", {});

                await expect(handler.throwIfCannotEnterPool(htlcRefundTransaction)).rejects.toThrowError(Contracts.TransactionPool.PoolError);
            });

            it("should throw if refund transaction already in pool", async () => {
                let anotherHtlcRefundTransaction = BuilderFactory.htlcRefund()
                    .htlcRefundAsset({
                        lockTransactionId: htlcLockTransaction.id!
                    })
                    .nonce("1")
                    .sign(passphrases[2])
                    .build();

                await app.get<Memory>(Identifiers.TransactionPoolMemory).addTransaction(anotherHtlcRefundTransaction);

                lockWallet.setAttribute("htlc.lockedBalance", Utils.BigNumber.make(6 * 1e8));

                lockWallet.setAttribute("htlc.locks", {
                    [htlcLockTransaction.id!]: {
                        amount: htlcLockTransaction.data.amount,
                        recipientId: htlcLockTransaction.data.recipientId,
                        ...htlcLockTransaction.data.asset!.lock,
                    },
                });

                walletRepository.reindex(lockWallet);

                await expect(handler.throwIfCannotEnterPool(htlcRefundTransaction)).rejects.toThrow(Contracts.TransactionPool.PoolError);
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
                await expect(handler.throwIfCannotBeApplied(htlcRefundTransaction, lockWallet, walletRepository)).toResolve();

                const balanceBefore = lockWallet.balance;

                // @ts-ignore
                expect(lockWallet.getAttribute("htlc.locks")[htlcLockTransaction.id]).toBeDefined();
                expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(htlcLockTransaction.data.amount);

                await handler.apply(htlcRefundTransaction, walletRepository);

                expect(lockWallet.getAttribute("htlc.locks")).toBeEmpty();
                expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(Utils.BigNumber.ZERO);
                expect(lockWallet.balance).toEqual(balanceBefore.plus(htlcLockTransaction.data.amount).minus(htlcRefundTransaction.data.fee));
            });

            it("should apply htlc refund transaction defined as exception", async () => {
                configManager.set("network.pubKeyHash", 99);
                configManager.set("exceptions.transactions", [htlcRefundTransaction.id]);

                await expect(handler.apply(htlcRefundTransaction, walletRepository)).toResolve();
            });

            it("should apply htlc refund transaction - when sender is not refund wallet", async () => {
                const dummyPassphrase = "not recipient of lock";
                const dummyWallet: Wallets.Wallet = factoryBuilder
                    .get("Wallet")
                    .withOptions({
                        passphrase: dummyPassphrase,
                        nonce: 0
                    })
                    .make();

                walletRepository.reindex(dummyWallet);

                htlcRefundTransaction = BuilderFactory.htlcRefund()
                    .htlcRefundAsset({
                        lockTransactionId: htlcLockTransaction.id!
                    })
                    .nonce("1")
                    .sign(dummyPassphrase)
                    .build();

                await expect(handler.throwIfCannotBeApplied(htlcRefundTransaction, dummyWallet, walletRepository)).toResolve();

                const balanceBefore = lockWallet.balance;

                // @ts-ignore
                expect(lockWallet.getAttribute("htlc.locks")[htlcLockTransaction.id]).toBeDefined();
                expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(htlcLockTransaction.data.amount);

                await handler.apply(htlcRefundTransaction, walletRepository);

                expect(lockWallet.getAttribute("htlc.locks")).toBeEmpty();
                expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(Utils.BigNumber.ZERO);
                expect(lockWallet.balance).toEqual(balanceBefore.plus(htlcLockTransaction.data.amount).minus(htlcRefundTransaction.data.fee));
            });
        });

        describe("revert", () => {
            it("should be ok", async () => {
                await expect(handler.throwIfCannotBeApplied(htlcRefundTransaction, lockWallet, walletRepository)).toResolve();

                setMockTransaction(htlcLockTransaction);
                const balanceBefore = lockWallet.balance;

                await handler.apply(htlcRefundTransaction, walletRepository);

                // @ts-ignore
                expect(lockWallet.getAttribute("htlc.locks")[htlcLockTransaction.id]).toBeUndefined();
                expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(Utils.BigNumber.ZERO);
                expect(lockWallet.balance).toEqual(balanceBefore.plus(htlcLockTransaction.data.amount).minus(htlcRefundTransaction.data.fee));

                await handler.revert(htlcRefundTransaction, walletRepository);

                const foundLockWallet = walletRepository.findByIndex(Contracts.State.WalletIndexes.Locks, htlcLockTransaction.id!);
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

                await expect(handler.throwIfCannotBeApplied(htlcRefundTransaction, lockWallet, walletRepository)).toResolve();

                setMockTransaction(htlcLockTransaction);
                const balanceBefore = lockWallet.balance;

                await handler.apply(htlcRefundTransaction, walletRepository);

                // @ts-ignore
                expect(lockWallet.getAttribute("htlc.locks")[htlcLockTransaction.id]).toBeUndefined();
                expect(lockWallet.getAttribute("htlc.lockedBalance")).toEqual(Utils.BigNumber.ZERO);
                expect(lockWallet.balance).toEqual(balanceBefore.plus(htlcLockTransaction.data.amount).minus(htlcRefundTransaction.data.fee));

                await handler.revert(htlcRefundTransaction, walletRepository);

                const foundLockWallet = walletRepository.findByIndex(Contracts.State.WalletIndexes.Locks, htlcLockTransaction.id!);
                expect(foundLockWallet).toBeDefined();

                expect(foundLockWallet.getAttribute("htlc.lockedBalance")).toEqual(htlcLockTransaction.data.amount);
                expect(foundLockWallet.balance).toEqual(balanceBefore);
            });
        });
    });
});
