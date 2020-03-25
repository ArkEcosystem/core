import "jest-extended";

import { Application, Contracts } from "@arkecosystem/core-kernel";
import { Identifiers } from "@arkecosystem/core-kernel/src/ioc";
import { Enums, Transactions as MagistrateTransactions } from "@arkecosystem/core-magistrate-crypto";
import {
    BridgechainRegistrationBuilder,
    BridgechainUpdateBuilder,
} from "@arkecosystem/core-magistrate-crypto/src/builders";
import {
    IBridgechainRegistrationAsset,
    IBridgechainUpdateAsset,
    IBusinessRegistrationAsset,
} from "@arkecosystem/core-magistrate-crypto/src/interfaces";
import {
    BridgechainIsNotRegisteredByWalletError,
    BridgechainIsResignedError,
    BusinessIsNotRegisteredError,
    BusinessIsResignedError,
    PortKeyMustBeValidPackageNameError,
} from "@arkecosystem/core-magistrate-transactions/src/errors";
import { MagistrateApplicationEvents } from "@arkecosystem/core-magistrate-transactions/src/events";
import {
    BridgechainRegistrationTransactionHandler,
    BridgechainUpdateTransactionHandler,
    BusinessRegistrationTransactionHandler,
} from "@arkecosystem/core-magistrate-transactions/src/handlers";
import { Wallets } from "@arkecosystem/core-state";
import { StateStore } from "@arkecosystem/core-state/src/stores/state";
import { Generators } from "@arkecosystem/core-test-framework/src";
import { Factories, FactoryBuilder } from "@arkecosystem/core-test-framework/src/factories";
import passphrases from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { Mempool } from "@arkecosystem/core-transaction-pool";
import { TransactionHandler } from "@arkecosystem/core-transactions/src/handlers";
import { TransactionHandlerRegistry } from "@arkecosystem/core-transactions/src/handlers/handler-registry";
import { Crypto, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { configManager } from "@arkecosystem/crypto/src/managers";

import { buildSenderWallet, initApp } from "../__support__/app";
import { Mocks, Converter } from "@packages/core-test-framework";

let app: Application;
let senderWallet: Contracts.State.Wallet;
let walletRepository: Contracts.State.WalletRepository;
let factoryBuilder: FactoryBuilder;
let transactionHandlerRegistry: TransactionHandlerRegistry;

const mockLastBlockData: Partial<Interfaces.IBlockData> = { timestamp: Crypto.Slots.getTime(), height: 4 };
const mockGetLastBlock = jest.fn();
StateStore.prototype.getLastBlock = mockGetLastBlock;
mockGetLastBlock.mockReturnValue({ data: mockLastBlockData });

beforeEach(() => {
    const config = Generators.generateCryptoConfigRaw();
    configManager.setConfig(config);
    Managers.configManager.setConfig(config);

    Mocks.TransactionRepository.setMockTransactions([]);

    app = initApp();

    app.bind(Identifiers.TransactionHandler).to(BusinessRegistrationTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(BridgechainRegistrationTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(BridgechainUpdateTransactionHandler);

    transactionHandlerRegistry = app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    factoryBuilder = new FactoryBuilder();
    Factories.registerWalletFactory(factoryBuilder);

    senderWallet = buildSenderWallet(app);

    walletRepository.index(senderWallet);
});

describe("BusinessRegistration", () => {
    let bridgechainRegistrationTransaction: Interfaces.ITransaction;
    let bridgechainUpdateTransaction: Interfaces.ITransaction;
    let handler: TransactionHandler;
    let businessRegistrationAsset: IBusinessRegistrationAsset;
    let bridgechainRegistrationAsset: IBridgechainRegistrationAsset;
    let bridgechainUpdateAsset: IBridgechainUpdateAsset;

    beforeEach(async () => {
        handler = transactionHandlerRegistry.getRegisteredHandlerByType(
            Transactions.InternalTransactionType.from(
                Enums.MagistrateTransactionType.BridgechainUpdate,
                Enums.MagistrateTransactionGroup,
            ),
            2,
        );

        businessRegistrationAsset = {
            name: "DummyBusiness",
            website: "https://www.dummy.example",
            vat: "EX1234567890",
            repository: "https://www.dummy.example/repo",
        };
        bridgechainRegistrationAsset = {
            name: "arkecosystem1",
            seedNodes: [
                "74.125.224.71",
                "74.125.224.72",
                "64.233.173.193",
                "2001:4860:4860::8888",
                "2001:4860:4860::8844",
            ],
            genesisHash: "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935",
            bridgechainRepository: "http://www.repository.com/myorg/myrepo",
            bridgechainAssetRepository: "http://www.repository.com/myorg/myassetrepo",
            ports: { "@arkecosystem/core-api": 12345 },
        };
        bridgechainUpdateAsset = {
            bridgechainId: bridgechainRegistrationAsset.genesisHash,
            seedNodes: [
                "74.125.224.71",
                "74.125.224.72",
                "64.233.173.193",
                "2001:4860:4860::8888",
                "2001:4860:4860::8844",
            ],
            bridgechainRepository: "http://www.repository.com/myorg/myrepo",
            bridgechainAssetRepository: "http://www.repository.com/myorg/myassetrepo",
            ports: { "@arkecosystem/core-api": 12345 },
        };

        bridgechainRegistrationTransaction = new BridgechainRegistrationBuilder()
            .bridgechainRegistrationAsset(bridgechainRegistrationAsset)
            .nonce("1")
            .sign(passphrases[0])
            .build();

        const bridgechainUpdateBuilder = new BridgechainUpdateBuilder();
        bridgechainUpdateTransaction = bridgechainUpdateBuilder
            .bridgechainUpdateAsset(bridgechainUpdateAsset)
            .nonce("1")
            .sign(passphrases[0])
            .build();

        senderWallet.setAttribute("business.businessAsset", businessRegistrationAsset);

        const businessAttributes = senderWallet.getAttribute("business");

        businessAttributes.bridgechains = {};

        businessAttributes.bridgechains[bridgechainRegistrationAsset.genesisHash] = {
            bridgechainAsset: bridgechainRegistrationAsset,
        };

        walletRepository.index(senderWallet);
    });

    afterEach(() => {
        try {
            Transactions.TransactionRegistry.deregisterTransactionType(
                MagistrateTransactions.BusinessRegistrationTransaction,
            );
            Transactions.TransactionRegistry.deregisterTransactionType(
                MagistrateTransactions.BridgechainRegistrationTransaction,
            );
            Transactions.TransactionRegistry.deregisterTransactionType(
                MagistrateTransactions.BridgechainUpdateTransaction,
            );
        } catch {}
    });

    describe("bootstrap", () => {
        it("should resolve", async () => {
            Mocks.TransactionRepository.setMockTransactions([Converter.convertCryptoTransactionToDatabaseTransaction(bridgechainUpdateTransaction, 1)]);

            await expect(handler.bootstrap()).toResolve();

            const bridgechainUpdateAssetClone = Object.assign({}, bridgechainUpdateAsset);
            delete bridgechainUpdateAssetClone.bridgechainId;

            expect(
                senderWallet.getAttribute("business.bridgechains")[bridgechainRegistrationAsset.genesisHash]
                    .bridgechainAsset,
            ).toEqual({
                ...bridgechainRegistrationAsset,
                ...bridgechainUpdateAssetClone,
            });
        });
    });

    describe("emitEvents", () => {
        it("should dispatch", async () => {
            const emitter: Contracts.Kernel.EventDispatcher = app.get<Contracts.Kernel.EventDispatcher>(
                Identifiers.EventDispatcherService,
            );

            const spy = jest.spyOn(emitter, "dispatch");

            handler.emitEvents(bridgechainUpdateTransaction, emitter);

            expect(spy).toHaveBeenCalledWith(MagistrateApplicationEvents.BridgechainUpdate, expect.anything());
        });
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", async () => {
            await expect(
                handler.throwIfCannotBeApplied(bridgechainUpdateTransaction, senderWallet, walletRepository),
            ).toResolve();
        });

        it("should throw if wallet is not business", async () => {
            senderWallet.forgetAttribute("business");
            await expect(
                handler.throwIfCannotBeApplied(bridgechainUpdateTransaction, senderWallet, walletRepository),
            ).rejects.toThrowError(BusinessIsNotRegisteredError);
        });

        it("should throw if business is resigned", async () => {
            senderWallet.setAttribute("business.resigned", true);
            await expect(
                handler.throwIfCannotBeApplied(bridgechainUpdateTransaction, senderWallet, walletRepository),
            ).rejects.toThrowError(BusinessIsResignedError);
        });

        it("should throw if wallet has no registered bridgechains", async () => {
            const businessAttributes = senderWallet.getAttribute("business");
            delete businessAttributes.bridgechains;

            await expect(
                handler.throwIfCannotBeApplied(bridgechainUpdateTransaction, senderWallet, walletRepository),
            ).rejects.toThrowError(BridgechainIsNotRegisteredByWalletError);
        });

        it("should throw if bridgechain is not registered", async () => {
            bridgechainUpdateAsset.bridgechainId = "6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b";

            bridgechainUpdateTransaction = new BridgechainUpdateBuilder()
                .bridgechainUpdateAsset(bridgechainUpdateAsset)
                .nonce("1")
                .sign(passphrases[0])
                .build();

            await expect(
                handler.throwIfCannotBeApplied(bridgechainUpdateTransaction, senderWallet, walletRepository),
            ).rejects.toThrowError(BridgechainIsNotRegisteredByWalletError);
        });

        it("should throw if bridgechain is resigned", async () => {
            const businessAttributes = senderWallet.getAttribute("business");
            businessAttributes.bridgechains[bridgechainRegistrationAsset.genesisHash].resigned = true;

            await expect(
                handler.throwIfCannotBeApplied(bridgechainUpdateTransaction, senderWallet, walletRepository),
            ).rejects.toThrowError(BridgechainIsResignedError);
        });

        it("should throw if wallet is port name is invalid", async () => {
            bridgechainUpdateTransaction.data.asset!.bridgechainUpdate.ports = { "@arkecosystem/INVALID": 55555 };

            await expect(
                handler.throwIfCannotBeApplied(bridgechainUpdateTransaction, senderWallet, walletRepository),
            ).rejects.toThrowError(PortKeyMustBeValidPackageNameError);
        });
    });

    describe("throwIfCannotEnterPool", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotEnterPool(bridgechainUpdateTransaction)).toResolve();
        });

        it("should throw if transaction by sender already in pool", async () => {
            await app.get<Mempool>(Identifiers.TransactionPoolMempool).addTransaction(bridgechainUpdateTransaction);

            await expect(handler.throwIfCannotEnterPool(bridgechainUpdateTransaction)).rejects.toThrow(
                Contracts.TransactionPool.PoolError,
            );
        });
    });

    describe("apply", () => {
        it("should be ok", async () => {
            const senderBalance = senderWallet.balance;

            await handler.apply(bridgechainUpdateTransaction, walletRepository);

            const bridgechainUpdateAssetClone = Object.assign({}, bridgechainUpdateAsset);
            delete bridgechainUpdateAssetClone.bridgechainId;

            expect(
                senderWallet.getAttribute("business.bridgechains")[bridgechainRegistrationAsset.genesisHash]
                    .bridgechainAsset,
            ).toEqual({
                ...bridgechainRegistrationAsset,
                ...bridgechainUpdateAssetClone,
            });

            expect(senderWallet.balance).toEqual(
                Utils.BigNumber.make(senderBalance)
                    .minus(bridgechainUpdateTransaction.data.amount)
                    .minus(bridgechainUpdateTransaction.data.fee),
            );
        });
    });

    describe("revert", () => {
        it("should be ok", async () => {
            const senderBalance = senderWallet.balance;

            const secondBridgechainUpdateAsset: IBridgechainUpdateAsset = {
                bridgechainId: bridgechainRegistrationAsset.genesisHash,
                seedNodes: [
                    "74.125.224.71",
                    "74.125.224.72",
                    "64.233.173.193",
                    "2001:4860:4860::8888",
                    "2001:4860:4860::8844",
                ],
                bridgechainRepository: "http://www.repository.com/myorg/myrepo/second",
                bridgechainAssetRepository: "http://www.repository.com/myorg/myassetrepo/second",
                ports: { "@arkecosystem/core-api": 54321 },
            };

            const secondBridgechainUpdateTransaction = new BridgechainUpdateBuilder()
                .bridgechainUpdateAsset(secondBridgechainUpdateAsset)
                .nonce("1")
                .sign(passphrases[0])
                .build();

            const secondBridgechainUpdateAssetClone = Object.assign({}, secondBridgechainUpdateAsset);
            delete secondBridgechainUpdateAssetClone.bridgechainId;

            const asset = senderWallet.getAttribute("business.bridgechains");
            asset[bridgechainRegistrationAsset.genesisHash].bridgechainAsset = {
                ...bridgechainRegistrationAsset,
                ...secondBridgechainUpdateAssetClone,
            };

            await handler.apply(bridgechainUpdateTransaction, walletRepository);

            const bridgechainUpdateAssetClone = Object.assign({}, bridgechainUpdateAsset);
            delete bridgechainUpdateAssetClone.bridgechainId;

            expect(
                senderWallet.getAttribute("business.bridgechains")[bridgechainRegistrationAsset.genesisHash]
                    .bridgechainAsset,
            ).toEqual({
                ...bridgechainRegistrationAsset,
                ...secondBridgechainUpdateAssetClone,
                ...bridgechainUpdateAssetClone,
            });

            Mocks.TransactionRepository.setMockTransactions([
                Converter.convertCryptoTransactionToDatabaseTransaction(bridgechainRegistrationTransaction, 1),
                Converter.convertCryptoTransactionToDatabaseTransaction(secondBridgechainUpdateTransaction, 2),
                Converter.convertCryptoTransactionToDatabaseTransaction(bridgechainUpdateTransaction, 3),
            ]);


            await handler.revert(bridgechainUpdateTransaction, walletRepository);

            expect(
                senderWallet.getAttribute("business.bridgechains")[bridgechainRegistrationAsset.genesisHash]
                    .bridgechainAsset,
            ).toEqual({
                ...bridgechainRegistrationAsset,
                ...secondBridgechainUpdateAssetClone,
            });

            expect(senderWallet.balance).toEqual(Utils.BigNumber.make(senderBalance));
        });
    });
});
