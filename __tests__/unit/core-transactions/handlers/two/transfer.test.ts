import "jest-extended";

import passphrases from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { BuilderFactory } from "@arkecosystem/crypto/src/transactions";
import { Application, Contracts } from "@arkecosystem/core-kernel";
import { Crypto, Enums, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { Factories, FactoryBuilder } from "@arkecosystem/core-test-framework/src/factories";
import { Generators } from "@arkecosystem/core-test-framework/src";
import { Identifiers } from "@arkecosystem/core-kernel/src/ioc";
import { StateStore } from "@arkecosystem/core-state/src/stores/state";
import { TransactionHandler } from "@arkecosystem/core-transactions/src/handlers";
import { TransactionHandlerRegistry } from "@arkecosystem/core-transactions/src/handlers/handler-registry";
import { Wallets } from "@arkecosystem/core-state";
import { configManager } from "@packages/crypto/src/managers";
import { TransferTransactionHandler } from "@arkecosystem/core-transactions/src/handlers/one";
import {
    ColdWalletError,
    InsufficientBalanceError,
    SenderWalletMismatchError,
} from "@arkecosystem/core-transactions/src/errors";
import { setMockTransaction } from "../__mocks__/transaction-repository";
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
            .recipientId(recipientWallet.address)
            .amount("10000000")
            .sign(passphrases[0])
            .nonce("1")
            .build();

        secondSignatureTransferTransaction = BuilderFactory.transfer()
            .recipientId(recipientWallet.address)
            .amount("1")
            .nonce("1")
            .sign(passphrases[1])
            .secondSign(passphrases[2])
            .build();

        multiSignatureTransferTransaction = BuilderFactory.transfer()
            .senderPublicKey(multiSignatureWallet.publicKey!)
            .recipientId(recipientWallet.address)
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
            setMockTransaction(transferTransaction);
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
            await expect(
                handler.throwIfCannotBeApplied(transferTransaction, senderWallet, walletRepository),
            ).toResolve();
        });

        it("should not throw - second sign", async () => {
            await expect(
                handler.throwIfCannotBeApplied(
                    secondSignatureTransferTransaction,
                    secondSignatureWallet,
                    walletRepository,
                ),
            ).toResolve();
        });

        it("should not throw - multi sign", async () => {
            await expect(
                handler.throwIfCannotBeApplied(
                    multiSignatureTransferTransaction,
                    multiSignatureWallet,
                    walletRepository,
                ),
            ).toResolve();
        });

        it("should throw", async () => {
            transferTransaction.data.senderPublicKey = "a".repeat(66);
            await expect(
                handler.throwIfCannotBeApplied(transferTransaction, senderWallet, walletRepository),
            ).rejects.toThrow(SenderWalletMismatchError);
        });

        it("should throw if wallet has insufficient funds for vote", async () => {
            senderWallet.balance = Utils.BigNumber.ZERO;
            await expect(
                handler.throwIfCannotBeApplied(transferTransaction, senderWallet, walletRepository),
            ).rejects.toThrow(InsufficientBalanceError);
        });

        it("should throw if sender is cold wallet", async () => {
            const coldWallet: Wallets.Wallet = factoryBuilder
                .get("Wallet")
                .withOptions({
                    passphrase: passphrases[3],
                    nonce: 0,
                })
                .make();

            coldWallet.balance = Utils.BigNumber.ZERO;

            transferTransaction = BuilderFactory.transfer()
                .amount("10000000")
                .recipientId(recipientWallet.address)
                .nonce("1")
                .sign(passphrases[3])
                .build();

            await expect(
                handler.throwIfCannotBeApplied(transferTransaction, coldWallet, walletRepository),
            ).rejects.toThrow(ColdWalletError);
        });

        it("should not throw if recipient is cold wallet", async () => {
            const coldWallet: Wallets.Wallet = factoryBuilder
                .get("Wallet")
                .withOptions({
                    passphrase: passphrases[3],
                    nonce: 0,
                })
                .make();

            coldWallet.balance = Utils.BigNumber.ZERO;

            transferTransaction = BuilderFactory.transfer()
                .amount("10000000")
                .recipientId(coldWallet.address)
                .nonce("1")
                .sign(passphrases[0])
                .build();

            await expect(
                handler.throwIfCannotBeApplied(transferTransaction, senderWallet, walletRepository),
            ).toResolve();
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
            const senderBalance = senderWallet.balance;
            const recipientBalance = recipientWallet.balance;

            await handler.apply(transferTransaction, walletRepository);

            expect(senderWallet.balance).toEqual(
                Utils.BigNumber.make(senderBalance)
                    .minus(transferTransaction.data.amount)
                    .minus(transferTransaction.data.fee),
            );

            expect(recipientWallet.balance).toEqual(
                Utils.BigNumber.make(recipientBalance).plus(transferTransaction.data.amount),
            );
        });
    });

    describe("revert", () => {
        it("should be ok", async () => {
            const senderBalance = senderWallet.balance;
            const recipientBalance = recipientWallet.balance;

            await handler.apply(transferTransaction, walletRepository);

            expect(senderWallet.balance).toEqual(
                Utils.BigNumber.make(senderBalance)
                    .minus(transferTransaction.data.amount)
                    .minus(transferTransaction.data.fee),
            );

            expect(recipientWallet.balance).toEqual(
                Utils.BigNumber.make(recipientBalance).plus(transferTransaction.data.amount),
            );

            await handler.revert(transferTransaction, walletRepository);

            expect(senderWallet.balance).toEqual(Utils.BigNumber.make(senderBalance));

            expect(recipientWallet.balance).toEqual(recipientBalance);
        });
    });
});
