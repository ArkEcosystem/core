import "jest-extended";

import { Application, Contracts } from "@packages/core-kernel";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { Wallets } from "@packages/core-state";
import { StateStore } from "@packages/core-state/src/stores/state";
import { Mapper, Mocks } from "@packages/core-test-framework";
import { Generators } from "@packages/core-test-framework/src";
import { Factories, FactoryBuilder } from "@packages/core-test-framework/src/factories";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import { HtlcLockExpiredError, InsufficientBalanceError } from "@packages/core-transactions/src/errors";
import { TransactionHandler } from "@packages/core-transactions/src/handlers";
import { TransactionHandlerRegistry } from "@packages/core-transactions/src/handlers/handler-registry";
import { Crypto, Enums, Interfaces, Managers, Transactions, Utils } from "@packages/crypto";
import { configManager } from "@packages/crypto/src/managers";
import { BuilderFactory } from "@packages/crypto/src/transactions";

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

describe("Htlc lock", () => {
    describe.each([EpochTimestamp, BlockHeight])("Htlc lock - expiration type %i", (expirationType) => {
        let htlcLockTransaction: Interfaces.ITransaction;
        let secondSignatureHtlcLockTransaction: Interfaces.ITransaction;
        let multiSignatureHtlcLockTransaction: Interfaces.ITransaction;
        let handler: TransactionHandler;
        let expiration: any;

        beforeAll(() => {
            Managers.configManager.setFromPreset("testnet");
        });

        beforeEach(async () => {
            const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(
                Identifiers.TransactionHandlerRegistry,
            );
            handler = transactionHandlerRegistry.getRegisteredHandlerByType(
                Transactions.InternalTransactionType.from(
                    Enums.TransactionType.HtlcLock,
                    Enums.TransactionTypeGroup.Core,
                ),
                2,
            );

            expiration = {
                type: expirationType,
                value: makeNotExpiredTimestamp(expirationType),
            };

            htlcLockTransaction = BuilderFactory.htlcLock()
                .htlcLockAsset({
                    secretHash: htlcSecretHashHex,
                    expiration: expiration,
                })
                .recipientId(recipientWallet.address)
                .amount("1")
                .nonce("1")
                .sign(passphrases[0])
                .build();

            secondSignatureHtlcLockTransaction = BuilderFactory.htlcLock()
                .htlcLockAsset({
                    secretHash: htlcSecretHashHex,
                    expiration: expiration,
                })
                .recipientId(recipientWallet.address)
                .amount("1")
                .nonce("1")
                .sign(passphrases[1])
                .secondSign(passphrases[2])
                .build();

            multiSignatureHtlcLockTransaction = BuilderFactory.htlcLock()
                .htlcLockAsset({
                    secretHash: htlcSecretHashHex,
                    expiration: expiration,
                })
                .senderPublicKey(multiSignatureWallet.publicKey!)
                .recipientId(recipientWallet.address)
                .amount("1")
                .nonce("1")
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

            it("should resolve with open transaction", async () => {
                const mockHtlcLockTransacton = Mapper.mapTransactionToModel(htlcLockTransaction);
                // @ts-ignore
                mockHtlcLockTransacton.open = true;

                Mocks.TransactionRepository.setTransactions([mockHtlcLockTransacton]);

                await expect(handler.bootstrap()).toResolve();
            });

            it("should resolve with open transaction using vendor field", async () => {
                htlcLockTransaction = BuilderFactory.htlcLock()
                    .htlcLockAsset({
                        secretHash: htlcSecretHashHex,
                        expiration: expiration,
                    })
                    .recipientId(recipientWallet.address)
                    .amount("1")
                    .nonce("1")
                    .vendorField("dummy")
                    .sign(passphrases[0])
                    .build();

                const mockHtlcLockTransacton = Mapper.mapTransactionToModel(htlcLockTransaction);
                // @ts-ignore
                mockHtlcLockTransacton.open = true;

                Mocks.TransactionRepository.setTransactions([mockHtlcLockTransacton]);
                await expect(handler.bootstrap()).toResolve();
            });
        });

        describe("throwIfCannotBeApplied", () => {
            it("should not throw", async () => {
                await expect(handler.throwIfCannotBeApplied(htlcLockTransaction, senderWallet)).toResolve();
            });

            it("should not throw - second sign", async () => {
                await expect(
                    handler.throwIfCannotBeApplied(secondSignatureHtlcLockTransaction, secondSignatureWallet),
                ).toResolve();
            });

            it("should not throw - multi sign", async () => {
                await expect(
                    handler.throwIfCannotBeApplied(multiSignatureHtlcLockTransaction, multiSignatureWallet),
                ).toResolve();
            });

            it("should throw if wallet has insufficient funds", async () => {
                senderWallet.balance = Utils.BigNumber.ZERO;

                await expect(handler.throwIfCannotBeApplied(htlcLockTransaction, senderWallet)).rejects.toThrow(
                    InsufficientBalanceError,
                );
            });

            it("should throw if lock is already expired", async () => {
                delete process.env.CORE_ENV;

                if (expirationType === Enums.HtlcLockExpirationType.BlockHeight) {
                    htlcLockTransaction.data.asset!.lock!.expiration.value = 4;
                } else {
                    htlcLockTransaction.data.asset!.lock!.expiration.value = Crypto.Slots.getTime();
                }

                await expect(handler.throwIfCannotBeApplied(htlcLockTransaction, senderWallet)).rejects.toThrow(
                    HtlcLockExpiredError,
                );

                if (expirationType === Enums.HtlcLockExpirationType.BlockHeight) {
                    htlcLockTransaction.data.asset!.lock!.expiration.value = 1000;
                } else {
                    htlcLockTransaction.data.asset!.lock!.expiration.value = Crypto.Slots.getTime() + 10000;
                }

                await expect(handler.throwIfCannotBeApplied(htlcLockTransaction, senderWallet)).toResolve();

                process.env.CORE_ENV = "test";
            });
        });

        describe("apply", () => {
            it("should apply htlc lock transaction", async () => {
                await expect(handler.throwIfCannotBeApplied(htlcLockTransaction, senderWallet)).toResolve();

                const balanceBefore = senderWallet.balance;

                await handler.apply(htlcLockTransaction);

                expect(senderWallet.getAttribute("htlc.locks", {})[htlcLockTransaction.id!]).toBeDefined();
                expect(senderWallet.getAttribute("htlc.lockedBalance")).toEqual(htlcLockTransaction.data.amount);
                expect(senderWallet.balance).toEqual(
                    balanceBefore.minus(htlcLockTransaction.data.fee).minus(htlcLockTransaction.data.amount),
                );
            });
        });

        describe("revert", () => {
            it("should be ok", async () => {
                await expect(handler.throwIfCannotBeApplied(htlcLockTransaction, senderWallet)).toResolve();

                const balanceBefore = senderWallet.balance;

                await handler.apply(htlcLockTransaction);

                expect(senderWallet.getAttribute("htlc.locks", {})[htlcLockTransaction.id!]).toBeDefined();
                expect(senderWallet.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO)).toEqual(
                    htlcLockTransaction.data.amount,
                );
                expect(senderWallet.balance).toEqual(
                    balanceBefore.minus(htlcLockTransaction.data.fee).minus(htlcLockTransaction.data.amount),
                );

                await handler.revert(htlcLockTransaction);

                expect(senderWallet.getAttribute("htlc.locks", {})[htlcLockTransaction.id!]).toBeUndefined();
                expect(senderWallet.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO)).toEqual(
                    Utils.BigNumber.ZERO,
                );
                expect(senderWallet.balance).toEqual(balanceBefore);
            });
        });
    });
});
