import "jest-extended";

import passphrases from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { Application, Contracts } from "@arkecosystem/core-kernel";
import { Crypto, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { Factories, FactoryBuilder } from "@arkecosystem/core-test-framework/src/factories";
import { Generators } from "@arkecosystem/core-test-framework/src";
import { Identifiers } from "@arkecosystem/core-kernel/src/ioc";
import { StateStore } from "@arkecosystem/core-state/src/stores/state";
import { TransactionHandler } from "@arkecosystem/core-transactions/src/handlers";
import { TransactionHandlerRegistry } from "@arkecosystem/core-transactions/src/handlers/handler-registry";
import { Wallets } from "@arkecosystem/core-state";
import { configManager } from "@packages/crypto/src/managers";
import { buildSenderWallet, initApp } from "./__support__/app";
import { setMockTransaction, setMockTransactions } from "./__mocks__/transaction-repository";
import {
    BridgechainRegistrationBuilder,
    BridgechainUpdateBuilder,
} from "@arkecosystem/core-magistrate-crypto/src/builders";
import {
    IBridgechainRegistrationAsset,
    IBridgechainUpdateAsset,
    IBusinessRegistrationAsset,
} from "@arkecosystem/core-magistrate-crypto/src/interfaces";
import { Enums, Transactions as MagistrateTransactions } from "@arkecosystem/core-magistrate-crypto";
import { Handlers } from "@arkecosystem/core-magistrate-transactions";
import { MagistrateApplicationEvents } from "@arkecosystem/core-magistrate-transactions/src/events";
import { setMockBlock } from "./__mocks__/block-repository";
import {
    BridgechainIsNotRegisteredByWalletError, BridgechainIsResignedError,
    BusinessIsNotRegisteredError,
    BusinessIsResignedError,
} from "@arkecosystem/core-magistrate-transactions/dist/errors";
import { Memory } from "@arkecosystem/core-transaction-pool";

let app: Application;
let senderWallet: Contracts.State.Wallet;
let walletRepository: Contracts.State.WalletRepository;
let factoryBuilder: FactoryBuilder;
let transactionHandlerRegistry: TransactionHandlerRegistry;

const mockLastBlockData: Partial<Interfaces.IBlockData> = { timestamp: Crypto.Slots.getTime() , height: 4 };
const mockGetLastBlock = jest.fn();
StateStore.prototype.getLastBlock = mockGetLastBlock;
mockGetLastBlock.mockReturnValue( { data: mockLastBlockData } );

beforeEach(() => {
    const config = Generators.generateCryptoConfigRaw();
    configManager.setConfig(config);
    Managers.configManager.setConfig(config);

    setMockTransaction(null);

    app = initApp();

    app.bind(Identifiers.TransactionHandler).to(Handlers.BusinessRegistrationTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(Handlers.BridgechainRegistrationTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(Handlers.BridgechainUpdateTransactionHandler);

    transactionHandlerRegistry = app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    factoryBuilder = new FactoryBuilder();
    Factories.registerWalletFactory(factoryBuilder);

    senderWallet = buildSenderWallet(app);

    walletRepository.reindex(senderWallet);
});

describe("BusinessRegistration", () => {
    let bridgechainRegistrationTransaction: Interfaces.ITransaction;
    let bridgechainUpdateTransaction: Interfaces.ITransaction;
    let handler: TransactionHandler;
    let businessRegistrationAsset: IBusinessRegistrationAsset;
    let bridgechainRegistrationAsset: IBridgechainRegistrationAsset;
    let bridgechainUpdateAsset: IBridgechainUpdateAsset;

    beforeEach(async () => {
        handler = transactionHandlerRegistry.getRegisteredHandlerByType(Transactions.InternalTransactionType.from(Enums.MagistrateTransactionType.BridgechainUpdate, Enums.MagistrateTransactionGroup), 2);

        businessRegistrationAsset = {
            name: "DummyBusiness",
            website: "https://www.dummy.example",
            vat: "EX1234567890",
            repository: "https://www.dummy.example/repo"
        };
        bridgechainRegistrationAsset = {
            name: "arkecosystem1",
            seedNodes: ["74.125.224.71", "74.125.224.72", "64.233.173.193", "2001:4860:4860::8888", "2001:4860:4860::8844"],
            genesisHash: "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935",
            bridgechainRepository: "http://www.repository.com/myorg/myrepo",
            bridgechainAssetRepository: "http://www.repository.com/myorg/myassetrepo",
            ports: { "@arkecosystem/core-api": 12345 },
        };
        bridgechainUpdateAsset = {
            bridgechainId: bridgechainRegistrationAsset.genesisHash,
            seedNodes: ["74.125.224.71", "74.125.224.72", "64.233.173.193", "2001:4860:4860::8888", "2001:4860:4860::8844"],
            bridgechainRepository: "http://www.repository.com/myorg/myrepo",
            bridgechainAssetRepository: "http://www.repository.com/myorg/myassetrepo",
            ports: { "@arkecosystem/core-api": 12345 },
        };

        bridgechainRegistrationTransaction = new BridgechainRegistrationBuilder()
            .bridgechainRegistrationAsset(bridgechainRegistrationAsset)
            .nonce("1")
            .sign(passphrases[0])
            .build();

        let bridgechainUpdateBuilder = new BridgechainUpdateBuilder();
        bridgechainUpdateTransaction = bridgechainUpdateBuilder
            .bridgechainUpdateAsset(bridgechainUpdateAsset)
            .nonce("1")
            .sign(passphrases[0])
            .build();

        senderWallet.setAttribute("business.businessAsset", businessRegistrationAsset);

        let businessAttributes = senderWallet.getAttribute("business");

        businessAttributes.bridgechains = {};

        businessAttributes.bridgechains[bridgechainRegistrationAsset.genesisHash] = {
            bridgechainAsset: bridgechainRegistrationAsset,
        };

        walletRepository.reindex(senderWallet);
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
        afterEach(() => {
            setMockBlock(null);
        });

        it("should resolve", async () => {
            setMockTransaction(bridgechainUpdateTransaction);
            await expect(handler.bootstrap()).toResolve();

            let bridgechainUpdateAssetClone = Object.assign({}, bridgechainUpdateAsset);
            delete bridgechainUpdateAssetClone.bridgechainId;

            expect(senderWallet.getAttribute("business.bridgechains")[bridgechainRegistrationAsset.genesisHash].bridgechainAsset).toEqual({
                ...bridgechainRegistrationAsset,
                ...bridgechainUpdateAssetClone,
            });
        });
    });

    describe("emitEvents", () => {
        it("should dispatch", async () => {
            let emitter:  Contracts.Kernel.EventDispatcher = app.get<Contracts.Kernel.EventDispatcher>(Identifiers.EventDispatcherService);

            const spy = jest.spyOn(emitter, 'dispatch');

            handler.emitEvents(bridgechainUpdateTransaction, emitter);

            expect(spy).toHaveBeenCalledWith(MagistrateApplicationEvents.BridgechainUpdate, expect.anything());
        });
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotBeApplied(bridgechainUpdateTransaction, senderWallet, walletRepository)).toResolve();
        });

        it("should throw if wallet is not business", async () => {
            senderWallet.forgetAttribute("business");
            await expect(handler.throwIfCannotBeApplied(bridgechainUpdateTransaction, senderWallet, walletRepository)).rejects.toThrowError(BusinessIsNotRegisteredError);
        });

        it("should throw if business is resigned", async () => {
            senderWallet.setAttribute("business.resigned", true);
            await expect(handler.throwIfCannotBeApplied(bridgechainUpdateTransaction, senderWallet, walletRepository)).rejects.toThrowError(BusinessIsResignedError);
        });

        it("should throw if wallet has no registered bridgechains", async () => {
            let businessAttributes = senderWallet.getAttribute("business");
            delete businessAttributes.bridgechains;

            await expect(handler.throwIfCannotBeApplied(bridgechainUpdateTransaction, senderWallet, walletRepository)).rejects.toThrowError(BridgechainIsNotRegisteredByWalletError);
        });


        it("should throw if bridgechain is not registered", async () => {
            bridgechainUpdateAsset.bridgechainId = "6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b";

            bridgechainUpdateTransaction = new BridgechainUpdateBuilder()
                .bridgechainUpdateAsset(bridgechainUpdateAsset)
                .nonce("1")
                .sign(passphrases[0])
                .build();

            await expect(handler.throwIfCannotBeApplied(bridgechainUpdateTransaction, senderWallet, walletRepository)).rejects.toThrowError(BridgechainIsNotRegisteredByWalletError);
        });

        it("should throw if bridgechain is resigned", async () => {
            let businessAttributes = senderWallet.getAttribute("business");
            businessAttributes.bridgechains[bridgechainRegistrationAsset.genesisHash].resigned = true;

            await expect(handler.throwIfCannotBeApplied(bridgechainUpdateTransaction, senderWallet, walletRepository)).rejects.toThrowError(BridgechainIsResignedError);
        });

        // TODO: PortKeyMustBeValidPackageNameError
    });

    describe("throwIfCannotEnterPool", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotEnterPool(bridgechainUpdateTransaction)).toResolve();
        });

        it("should throw if transaction by sender already in pool", async () => {
            await app.get<Memory>(Identifiers.TransactionPoolMemory).addTransaction(bridgechainUpdateTransaction);

            await expect(handler.throwIfCannotEnterPool(bridgechainUpdateTransaction)).rejects.toThrow(Contracts.TransactionPool.PoolError);
        });
    });

    describe("apply", () => {
        it("should be ok", async () => {
            const senderBalance = senderWallet.balance;

            await handler.apply(bridgechainUpdateTransaction, walletRepository);

            let bridgechainUpdateAssetClone = Object.assign({}, bridgechainUpdateAsset);
            delete bridgechainUpdateAssetClone.bridgechainId;

            expect(senderWallet.getAttribute("business.bridgechains")[bridgechainRegistrationAsset.genesisHash].bridgechainAsset).toEqual({
                ...bridgechainRegistrationAsset,
                ...bridgechainUpdateAssetClone
            });

            expect(senderWallet.balance).toEqual(Utils.BigNumber.make(senderBalance)
                .minus(bridgechainUpdateTransaction.data.amount)
                .minus(bridgechainUpdateTransaction.data.fee));
        });
    });

    describe("revert", () => {
        it("should be ok", async () => {
            const senderBalance = senderWallet.balance;

            let secondBridgechainUpdateAsset: IBridgechainUpdateAsset = {
                bridgechainId: bridgechainRegistrationAsset.genesisHash,
                seedNodes: ["74.125.224.71", "74.125.224.72", "64.233.173.193", "2001:4860:4860::8888", "2001:4860:4860::8844"],
                bridgechainRepository: "http://www.repository.com/myorg/myrepo/second",
                bridgechainAssetRepository: "http://www.repository.com/myorg/myassetrepo/sedond",
                ports: { "@arkecosystem/core-api": 54321 },
            };

            let secondBridgechainUpdateTransaction = new BridgechainUpdateBuilder()
                .bridgechainUpdateAsset(secondBridgechainUpdateAsset)
                .nonce("1")
                .sign(passphrases[0])
                .build();

            let secondBridgechainUpdateAssetClone = Object.assign({}, secondBridgechainUpdateAsset);
            delete secondBridgechainUpdateAssetClone.bridgechainId;

            let asset = senderWallet.getAttribute("business.bridgechains");
            asset[bridgechainRegistrationAsset.genesisHash].bridgechainAsset = {
                ...bridgechainRegistrationAsset,
                ...secondBridgechainUpdateAssetClone,
            };

            await handler.apply(bridgechainUpdateTransaction, walletRepository);

            let bridgechainUpdateAssetClone = Object.assign({}, bridgechainUpdateAsset);
            delete bridgechainUpdateAssetClone.bridgechainId;

            expect(senderWallet.getAttribute("business.bridgechains")[bridgechainRegistrationAsset.genesisHash].bridgechainAsset).toEqual({
                ...bridgechainRegistrationAsset,
                ...secondBridgechainUpdateAssetClone,
                ...bridgechainUpdateAssetClone
            });

            console.log(bridgechainRegistrationTransaction);

            // @ts-ignore
            setMockTransactions([bridgechainRegistrationTransaction, secondBridgechainUpdateTransaction]);

            await handler.revert(bridgechainUpdateTransaction, walletRepository);

            expect(senderWallet.getAttribute("business.bridgechains")[bridgechainRegistrationAsset.genesisHash].bridgechainAsset).toEqual({
                ...bridgechainRegistrationAsset,
                ...secondBridgechainUpdateAssetClone
            });

            expect(senderWallet.balance).toEqual(Utils.BigNumber.make(senderBalance));
        });
    });
});
