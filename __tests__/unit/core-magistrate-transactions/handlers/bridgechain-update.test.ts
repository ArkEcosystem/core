import "jest-extended";

import _ from "lodash";

import { buildSenderWallet, initApp } from "../__support__/app";
import { CryptoSuite, Interfaces as BlockInterfaces } from "../../../../packages/core-crypto";
import { Application, Contracts } from "../../../../packages/core-kernel";
import { Identifiers } from "../../../../packages/core-kernel/src/ioc";
import { Enums, Transactions as MagistrateTransactions } from "../../../../packages/core-magistrate-crypto";
import {
    BridgechainRegistrationBuilder,
    BridgechainUpdateBuilder,
} from "../../../../packages/core-magistrate-crypto/src/builders";
import {
    IBridgechainRegistrationAsset,
    IBridgechainUpdateAsset,
    IBusinessRegistrationAsset,
} from "../../../../packages/core-magistrate-crypto/src/interfaces";
import {
    BridgechainIsNotRegisteredByWalletError,
    BridgechainIsResignedError,
    BusinessIsNotRegisteredError,
    BusinessIsResignedError,
    PortKeyMustBeValidPackageNameError,
} from "../../../../packages/core-magistrate-transactions/src/errors";
import { MagistrateApplicationEvents } from "../../../../packages/core-magistrate-transactions/src/events";
import {
    BridgechainRegistrationTransactionHandler,
    BridgechainUpdateTransactionHandler,
    BusinessRegistrationTransactionHandler,
} from "../../../../packages/core-magistrate-transactions/src/handlers";
import { Wallets } from "../../../../packages/core-state";
import { StateStore } from "../../../../packages/core-state/src/stores/state";
import { Mapper, Mocks } from "../../../../packages/core-test-framework/src";
import { Generators } from "../../../../packages/core-test-framework/src";
import { Factories, FactoryBuilder } from "../../../../packages/core-test-framework/src/factories";
import passphrases from "../../../../packages/core-test-framework/src/internal/passphrases.json";
import { Mempool } from "../../../../packages/core-transaction-pool";
import { TransactionHandler } from "../../../../packages/core-transactions/src/handlers";
import { TransactionHandlerRegistry } from "../../../../packages/core-transactions/src/handlers/handler-registry";
import { Interfaces, Transactions } from "../../../../packages/crypto";
import { Assets } from "./__fixtures__";

let app: Application;
let senderWallet: Contracts.State.Wallet;
let walletRepository: Contracts.State.WalletRepository;
let factoryBuilder: FactoryBuilder;
let transactionHandlerRegistry: TransactionHandlerRegistry;
let crypto: CryptoSuite.CryptoSuite;

let mockLastBlockData: Partial<BlockInterfaces.IBlockData>;
let mockGetLastBlock;
const transactionHistoryService = {
    findManyByCriteria: jest.fn(),
};

beforeEach(() => {
    const config = Generators.generateCryptoConfigRaw();
    crypto = new CryptoSuite.CryptoSuite(config);
    crypto.CryptoManager.HeightTracker.setHeight(2);

    Mocks.TransactionRepository.setTransactions([]);

    app = initApp(crypto);

    mockLastBlockData = { timestamp: crypto.CryptoManager.LibraryManager.Crypto.Slots.getTime(), height: 4 };
    mockGetLastBlock = jest.fn();
    StateStore.prototype.getLastBlock = mockGetLastBlock;
    mockGetLastBlock.mockReturnValue({ data: mockLastBlockData });

    app.bind(Identifiers.TransactionHandler).to(BusinessRegistrationTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(BridgechainRegistrationTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(BridgechainUpdateTransactionHandler);
    app.bind(Identifiers.TransactionHistoryService).toConstantValue(transactionHistoryService);

    transactionHandlerRegistry = app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    factoryBuilder = new FactoryBuilder(crypto);
    Factories.registerWalletFactory(factoryBuilder);

    senderWallet = buildSenderWallet(app, crypto.CryptoManager);

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

        businessRegistrationAsset = _.cloneDeep(Assets.businessRegistrationAsset);
        bridgechainRegistrationAsset = _.cloneDeep(Assets.bridgechainRegistrationAsset);
        bridgechainUpdateAsset = _.cloneDeep(Assets.bridgechainUpdateAsset);

        bridgechainRegistrationTransaction = new BridgechainRegistrationBuilder(
            crypto.CryptoManager,
            crypto.TransactionManager.TransactionFactory,
            crypto.TransactionManager.TransactionTools,
        )
            .bridgechainRegistrationAsset(bridgechainRegistrationAsset)
            .nonce("1")
            .sign(passphrases[0])
            .build();

        const bridgechainUpdateBuilder = new BridgechainUpdateBuilder(
            crypto.CryptoManager,
            crypto.TransactionManager.TransactionFactory,
            crypto.TransactionManager.TransactionTools,
        );
        bridgechainUpdateTransaction = bridgechainUpdateBuilder
            .bridgechainUpdateAsset(bridgechainUpdateAsset)
            .nonce("2")
            .sign(passphrases[0])
            .build();

        senderWallet.setAttribute("business.businessAsset", businessRegistrationAsset);
        senderWallet.nonce = crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("1");

        const businessAttributes = senderWallet.getAttribute("business");

        businessAttributes.bridgechains = {};

        businessAttributes.bridgechains[bridgechainRegistrationAsset.genesisHash] = {
            bridgechainAsset: bridgechainRegistrationAsset,
        };

        walletRepository.index(senderWallet);
    });

    afterEach(() => {
        try {
            crypto.TransactionManager.TransactionTools.TransactionRegistry.deregisterTransactionType(
                MagistrateTransactions.BusinessRegistrationTransaction,
            );
            crypto.TransactionManager.TransactionTools.TransactionRegistry.deregisterTransactionType(
                MagistrateTransactions.BridgechainRegistrationTransaction,
            );
            crypto.TransactionManager.TransactionTools.TransactionRegistry.deregisterTransactionType(
                MagistrateTransactions.BridgechainUpdateTransaction,
            );
        } catch {}
    });

    describe("bootstrap", () => {
        it("should resolve", async () => {
            Mocks.TransactionRepository.setTransactions([
                Mapper.mapTransactionToModel(bridgechainUpdateTransaction, crypto.CryptoManager as any, 1),
            ]);

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

            bridgechainUpdateTransaction = new BridgechainUpdateBuilder(
                crypto.CryptoManager,
                crypto.TransactionManager.TransactionFactory,
                crypto.TransactionManager.TransactionTools,
            )
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
                crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make(senderBalance)
                    .minus(bridgechainUpdateTransaction.data.amount)
                    .minus(bridgechainUpdateTransaction.data.fee),
            );
        });
    });

    describe("revert", () => {
        it("should be ok", async () => {
            const senderBalance = senderWallet.balance;

            const bridgechainUpdateAssetClone = Object.assign({}, bridgechainUpdateAsset);
            delete bridgechainUpdateAssetClone.bridgechainId;
            const asset = senderWallet.getAttribute("business.bridgechains");
            asset[bridgechainRegistrationAsset.genesisHash].bridgechainAsset = {
                ...bridgechainRegistrationAsset,
                ...bridgechainUpdateAssetClone,
            };
            senderWallet.nonce = crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("2");

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

            const secondBridgechainUpdateTransaction = new BridgechainUpdateBuilder(
                crypto.CryptoManager,
                crypto.TransactionManager.TransactionFactory,
                crypto.TransactionManager.TransactionTools,
            )
                .bridgechainUpdateAsset(secondBridgechainUpdateAsset)
                .nonce("3")
                .sign(passphrases[0])
                .build();

            await handler.apply(secondBridgechainUpdateTransaction, walletRepository);

            const secondBridgechainUpdateAssetClone = Object.assign({}, secondBridgechainUpdateAsset);
            delete secondBridgechainUpdateAssetClone.bridgechainId;

            expect(
                senderWallet.getAttribute("business.bridgechains")[bridgechainRegistrationAsset.genesisHash]
                    .bridgechainAsset,
            ).toEqual({
                ...bridgechainRegistrationAsset,
                ...bridgechainUpdateAssetClone,
                ...secondBridgechainUpdateAssetClone,
            });

            transactionHistoryService.findManyByCriteria.mockResolvedValueOnce([
                bridgechainRegistrationTransaction.data,
                bridgechainUpdateTransaction.data,
                secondBridgechainUpdateTransaction.data,
            ]);

            await handler.revert(secondBridgechainUpdateTransaction, walletRepository);

            expect(
                senderWallet.getAttribute("business.bridgechains")[bridgechainRegistrationAsset.genesisHash]
                    .bridgechainAsset,
            ).toEqual({
                ...bridgechainRegistrationAsset,
                ...bridgechainUpdateAssetClone,
            });

            expect(senderWallet.balance).toEqual(senderBalance);
        });
    });
});
