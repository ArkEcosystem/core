import "jest-extended";

import { Application, Contracts } from "@packages/core-kernel";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { Wallets } from "@packages/core-state";
import { StateStore } from "@packages/core-state/src/stores/state";
import { Mapper, Mocks } from "@packages/core-test-framework";
import { Generators } from "@packages/core-test-framework/src";
import { Factories, FactoryBuilder } from "@packages/core-test-framework/src/factories";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import {
    ColdWalletError,
    InsufficientBalanceError,
    SenderWalletMismatchError,
} from "@packages/core-transactions/src/errors";
import { TransactionHandler } from "@packages/core-transactions/src/handlers";
import { TransactionHandlerRegistry } from "@packages/core-transactions/src/handlers/handler-registry";
import { TransferTransactionHandler } from "@packages/core-transactions/src/handlers/one";
import { Crypto, Enums, Interfaces, Managers, Transactions, Utils } from "@packages/crypto";
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

describe("TransferTransaction", () => {
    let transferTransaction: Interfaces.ITransaction;
    let secondSignatureTransferTransaction: Interfaces.ITransaction;
    let multiSignatureTransferTransaction: Interfaces.ITransaction;
    let handler: TransactionHandler;
    let pubKeyHash: number;

    beforeEach(async () => {
        pubKeyHash = Managers.configManager.get("network.pubKeyHash");
        const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(
            Identifiers.TransactionHandlerRegistry,
        );
        handler = transactionHandlerRegistry.getRegisteredHandlerByType(
            Transactions.InternalTransactionType.from(Enums.TransactionType.Transfer, Enums.TransactionTypeGroup.Core),
            2,
        );

        transferTransaction = BuilderFactory.transfer()
            .recipientId(recipientWallet.getAddress())
            .amount("10000000")
            .sign(passphrases[0])
            .nonce("1")
            .build();

        secondSignatureTransferTransaction = BuilderFactory.transfer()
            .recipientId(recipientWallet.getAddress())
            .amount("1")
            .nonce("1")
            .sign(passphrases[1])
            .secondSign(passphrases[2])
            .build();

        multiSignatureTransferTransaction = BuilderFactory.transfer()
            .senderPublicKey(multiSignatureWallet.getPublicKey()!)
            .recipientId(recipientWallet.getAddress())
            .amount("1")
            .nonce("1")
            .multiSign(passphrases[0], 0)
            .multiSign(passphrases[1], 1)
            .multiSign(passphrases[2], 2)
            .build();
    });

    afterEach(async () => {
        Managers.configManager.set("network.pubKeyHash", pubKeyHash);
    });

    describe("bootstrap", () => {
        it("should resolve", async () => {
            Mocks.TransactionRepository.setTransactions([Mapper.mapTransactionToModel(transferTransaction)]);
            await expect(handler.bootstrap()).toResolve();
        });
    });

    describe("hasVendorField", () => {
        it("should return true", async () => {
            await expect((<TransferTransactionHandler>handler).hasVendorField()).toBeTrue();
        });
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotBeApplied(transferTransaction, senderWallet)).toResolve();
        });

        it("should not throw - second sign", async () => {
            await expect(
                handler.throwIfCannotBeApplied(secondSignatureTransferTransaction, secondSignatureWallet),
            ).toResolve();
        });

        it("should not throw - multi sign", async () => {
            await expect(
                handler.throwIfCannotBeApplied(multiSignatureTransferTransaction, multiSignatureWallet),
            ).toResolve();
        });

        it("should throw", async () => {
            transferTransaction.data.senderPublicKey = "a".repeat(66);
            await expect(handler.throwIfCannotBeApplied(transferTransaction, senderWallet)).rejects.toThrow(
                SenderWalletMismatchError,
            );
        });

        it("should throw if wallet has insufficient funds for vote", async () => {
            senderWallet.setBalance(Utils.BigNumber.ZERO);
            await expect(handler.throwIfCannotBeApplied(transferTransaction, senderWallet)).rejects.toThrow(
                InsufficientBalanceError,
            );
        });

        it("should throw if sender is cold wallet", async () => {
            const coldWallet: Wallets.Wallet = factoryBuilder
                .get("Wallet")
                .withOptions({
                    passphrase: passphrases[3],
                    nonce: 0,
                })
                .make();

            coldWallet.setBalance(Utils.BigNumber.ZERO);

            transferTransaction = BuilderFactory.transfer()
                .amount("10000000")
                .recipientId(recipientWallet.getAddress())
                .nonce("1")
                .sign(passphrases[3])
                .build();

            await expect(handler.throwIfCannotBeApplied(transferTransaction, coldWallet)).rejects.toThrow(
                ColdWalletError,
            );
        });

        it("should not throw if recipient is cold wallet", async () => {
            const coldWallet: Wallets.Wallet = factoryBuilder
                .get("Wallet")
                .withOptions({
                    passphrase: passphrases[3],
                    nonce: 0,
                })
                .make();

            coldWallet.setBalance(Utils.BigNumber.ZERO);

            transferTransaction = BuilderFactory.transfer()
                .amount("10000000")
                .recipientId(coldWallet.getAddress())
                .nonce("1")
                .sign(passphrases[0])
                .build();

            await expect(handler.throwIfCannotBeApplied(transferTransaction, senderWallet)).toResolve();
        });
    });

    describe("throwIfCannotEnterPool", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotEnterPool(transferTransaction)).toResolve();
        });

        it("should throw if no wallet is not recipient on the active network", async () => {
            Managers.configManager.set("network.pubKeyHash", 99);

            await expect(handler.throwIfCannotEnterPool(transferTransaction)).rejects.toThrow(
                Contracts.TransactionPool.PoolError,
            );
        });
    });

    describe("apply", () => {
        it("should be ok", async () => {
            const senderBalance = senderWallet.getBalance();
            const recipientBalance = recipientWallet.getBalance();

            await handler.apply(transferTransaction);

            expect(senderWallet.getBalance()).toEqual(
                Utils.BigNumber.make(senderBalance)
                    .minus(transferTransaction.data.amount)
                    .minus(transferTransaction.data.fee),
            );

            expect(recipientWallet.getBalance()).toEqual(
                Utils.BigNumber.make(recipientBalance).plus(transferTransaction.data.amount),
            );
        });
    });

    describe("revert", () => {
        it("should be ok", async () => {
            const senderBalance = senderWallet.getBalance();
            const recipientBalance = recipientWallet.getBalance();

            await handler.apply(transferTransaction);

            expect(senderWallet.getBalance()).toEqual(
                Utils.BigNumber.make(senderBalance)
                    .minus(transferTransaction.data.amount)
                    .minus(transferTransaction.data.fee),
            );

            expect(recipientWallet.getBalance()).toEqual(
                Utils.BigNumber.make(recipientBalance).plus(transferTransaction.data.amount),
            );

            await handler.revert(transferTransaction);

            expect(senderWallet.getBalance()).toEqual(Utils.BigNumber.make(senderBalance));

            expect(recipientWallet.getBalance()).toEqual(recipientBalance);
        });
    });
});
