import "jest-extended";

import { Application, Contracts, Services } from "@packages/core-kernel";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { Wallets } from "@packages/core-state";
import { StateStore } from "@packages/core-state/src/stores/state";
import { Mocks } from "@packages/core-test-framework";
import { Generators } from "@packages/core-test-framework/src";
import { Factories, FactoryBuilder } from "@packages/core-test-framework/src/factories";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import { getWalletAttributeSet } from "@packages/core-test-framework/src/internal/wallet-attributes";
import {
    LegacyMultiSignatureError,
    MultiSignatureAlreadyRegisteredError,
} from "@packages/core-transactions/src/errors";
import { TransactionHandler } from "@packages/core-transactions/src/handlers";
import { TransactionHandlerRegistry } from "@packages/core-transactions/src/handlers/handler-registry";
import { Crypto, Enums, Identities, Interfaces, Managers, Transactions, Utils } from "@packages/crypto";
import { IMultiSignatureAsset } from "@packages/crypto/src/interfaces";
import { configManager } from "@packages/crypto/src/managers";
import { BuilderFactory } from "@packages/crypto/src/transactions";

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
    configManager.getMilestone().aip11 = false;
    Managers.configManager.getMilestone().aip11 = false;

    app = initApp();
    app.bind(Identifiers.TransactionHistoryService).toConstantValue(transactionHistoryService);

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

describe("MultiSignatureRegistrationTransaction", () => {
    let multiSignatureTransaction: Interfaces.ITransaction;
    let recipientWallet: Wallets.Wallet;
    let handler: TransactionHandler;
    let multiSignatureAsset: IMultiSignatureAsset;

    beforeEach(async () => {
        const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(
            Identifiers.TransactionHandlerRegistry,
        );
        handler = transactionHandlerRegistry.getRegisteredHandlerByType(
            Transactions.InternalTransactionType.from(
                Enums.TransactionType.MultiSignature,
                Enums.TransactionTypeGroup.Core,
            ),
            1,
        );

        senderWallet.balance = Utils.BigNumber.make(100390000000);

        multiSignatureAsset = {
            publicKeys: [
                Identities.PublicKey.fromPassphrase(passphrases[0]),
                Identities.PublicKey.fromPassphrase(passphrases[1]),
                Identities.PublicKey.fromPassphrase(passphrases[2]),
            ],
            min: 2,
        };

        recipientWallet = new Wallets.Wallet(
            Identities.Address.fromMultiSignatureAsset(multiSignatureAsset),
            new Services.Attributes.AttributeMap(getWalletAttributeSet()),
        );

        walletRepository.index(recipientWallet);

        multiSignatureTransaction = BuilderFactory.multiSignature()
            .version(1)
            .multiSignatureAsset(multiSignatureAsset)
            .senderPublicKey(Identities.PublicKey.fromPassphrase(passphrases[0]))
            .nonce("1")
            .recipientId(recipientWallet.publicKey!)
            .multiSign(passphrases[0], 0) // ! implicitly sets version to 2
            .multiSign(passphrases[1], 1)
            .multiSign(passphrases[2], 2)
            .sign(passphrases[0])
            .build();

        multiSignatureTransaction.data.asset.multiSignatureLegacy = "multiSignatureLegacy mock" as any;
    });

    describe("bootstrap", () => {
        it("should resolve", async () => {
            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield multiSignatureTransaction.data;
            });

            await expect(handler.bootstrap()).toResolve();

            expect(transactionHistoryService.streamByCriteria).toBeCalledWith({
                typeGroup: Enums.TransactionTypeGroup.Core,
                type: Enums.TransactionType.MultiSignature,
                version: 1,
            });
        });

        it("should throw when wallet has multi signature", async () => {
            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield multiSignatureTransaction.data;
            });
            senderWallet.setAttribute("multiSignature", multiSignatureAsset);

            await expect(handler.bootstrap()).rejects.toThrow(MultiSignatureAlreadyRegisteredError);
        });
    });

    describe("throwIfCannotBeApplied", () => {
        let pubKeyHash: number;

        beforeEach(() => {
            pubKeyHash = configManager.get("network.pubKeyHash");
        });

        afterEach(() => {
            configManager.set("exceptions.transactions", []);
            configManager.set("network.pubKeyHash", pubKeyHash);
        });

        it("should throw", async () => {
            await expect(handler.throwIfCannotBeApplied(multiSignatureTransaction, senderWallet)).rejects.toThrow(
                LegacyMultiSignatureError,
            );
        });

        it("should not throw defined as exception", async () => {
            configManager.set("network.pubKeyHash", 99);
            configManager.set("exceptions.transactions", [multiSignatureTransaction.id]);

            await expect(handler.throwIfCannotBeApplied(multiSignatureTransaction, senderWallet)).toResolve();
        });
    });

    describe("throwIfCannotEnterPool", () => {
        it("should throw", async () => {
            await expect(handler.throwIfCannotEnterPool(multiSignatureTransaction)).rejects.toThrow(
                Contracts.TransactionPool.PoolError,
            );
        });
    });

    describe("isActivated", () => {
        it("should return true when aip11 is false", async () => {
            configManager.getMilestone().aip11 = false;
            await expect(handler.isActivated()).resolves.toBe(true);
        });
        it("should return true when aip11 is undefined", async () => {
            configManager.getMilestone().aip11 = undefined;
            await expect(handler.isActivated()).resolves.toBe(true);
        });
        it("should return false when aip11 is true", async () => {
            configManager.getMilestone().aip11 = true;
            await expect(handler.isActivated()).resolves.toBe(false);
        });
    });
});
