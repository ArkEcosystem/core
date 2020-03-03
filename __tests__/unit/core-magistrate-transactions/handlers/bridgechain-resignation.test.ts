import "jest-extended";

import passphrases from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { Application, Contracts } from "@arkecosystem/core-kernel";
import { BridgechainResignationBuilder } from "@arkecosystem/core-magistrate-crypto/src/builders";
import { Crypto, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { Enums, Transactions as MagistrateTransactions } from "@arkecosystem/core-magistrate-crypto";
import { Factories, FactoryBuilder } from "@arkecosystem/core-test-framework/src/factories";
import { Generators } from "@arkecosystem/core-test-framework/src";
import { Identifiers } from "@arkecosystem/core-kernel/src/ioc";
import { InsufficientBalanceError } from "@arkecosystem/core-transactions/dist/errors";
import { MagistrateApplicationEvents } from "@arkecosystem/core-magistrate-transactions/src/events";
import { Memory } from "@arkecosystem/core-transaction-pool";
import { StateStore } from "@arkecosystem/core-state/src/stores/state";
import { TransactionHandler } from "@arkecosystem/core-transactions/src/handlers";
import { TransactionHandlerRegistry } from "@arkecosystem/core-transactions/src/handlers/handler-registry";
import { Wallets } from "@arkecosystem/core-state";
import { buildSenderWallet, initApp } from "../__support__/app";
import { configManager } from "@arkecosystem/crypto/src/managers";
import { setMockBlock } from "../__mocks__/block-repository";
import { setMockTransaction } from "../__mocks__/transaction-repository";
import {
    IBridgechainRegistrationAsset,
    IBusinessRegistrationAsset,
} from "@arkecosystem/core-magistrate-crypto/src/interfaces";
import {
    BridgechainIsNotRegisteredByWalletError,
    BridgechainIsResignedError,
    BusinessIsResignedError,
    WalletIsNotBusinessError,
} from "@arkecosystem/core-magistrate-transactions/src/errors";
import {
    BridgechainRegistrationTransactionHandler,
    BridgechainResignationTransactionHandler,
    BusinessRegistrationTransactionHandler,
} from "@arkecosystem/core-magistrate-transactions/src/handlers";

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

    app.bind(Identifiers.TransactionHandler).to(BusinessRegistrationTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(BridgechainRegistrationTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(BridgechainResignationTransactionHandler);

    transactionHandlerRegistry = app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    factoryBuilder = new FactoryBuilder();
    Factories.registerWalletFactory(factoryBuilder);

    senderWallet = buildSenderWallet(app);

    walletRepository.index(senderWallet);
});

describe("BusinessRegistration", () => {
    let bridgechainResignationTransaction: Interfaces.ITransaction;
    let handler: TransactionHandler;
    let businessRegistrationAsset: IBusinessRegistrationAsset = {
        name: "DummyBusiness",
        website: "https://www.dummy.example",
        vat: "EX1234567890",
        repository: "https://www.dummy.example/repo"
    };
    let bridgechainRegistrationAsset: IBridgechainRegistrationAsset = {
        name: "arkecosystem1",
        seedNodes: ["74.125.224.71", "74.125.224.72", "64.233.173.193", "2001:4860:4860::8888", "2001:4860:4860::8844"],
        genesisHash: "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935",
        bridgechainRepository: "http://www.repository.com/myorg/myrepo",
        bridgechainAssetRepository: "http://www.repository.com/myorg/myassetrepo",
        ports: { "@arkecosystem/core-api": 12345 },
    };

    beforeEach(async () => {
        handler = transactionHandlerRegistry.getRegisteredHandlerByType(Transactions.InternalTransactionType.from(Enums.MagistrateTransactionType.BridgechainResignation, Enums.MagistrateTransactionGroup), 2);

        bridgechainResignationTransaction = new BridgechainResignationBuilder()
            .bridgechainResignationAsset(bridgechainRegistrationAsset.genesisHash)
            .nonce("1")
            .sign(passphrases[0])
            .build();

        senderWallet.setAttribute("business.businessAsset", businessRegistrationAsset);

        let businessAttributes = senderWallet.getAttribute("business");

        businessAttributes.bridgechains = {};

        businessAttributes.bridgechains[bridgechainRegistrationAsset.genesisHash] = {
            bridgechainAsset: bridgechainRegistrationAsset,
        };

        senderWallet.setAttribute("business", businessAttributes);

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
                MagistrateTransactions.BridgechainResignationTransaction,
            );
        } catch {}
    });

    describe("bootstrap", () => {
        afterEach(() => {
            setMockBlock(null);
        });

        it("should resolve", async () => {
            setMockTransaction(bridgechainResignationTransaction);
            await expect(handler.bootstrap()).toResolve();

            expect(senderWallet.getAttribute("business.bridgechains")[bridgechainRegistrationAsset.genesisHash].resigned).toBeTrue();
        });
    });

    describe("emitEvents", () => {
        it("should dispatch", async () => {
            let emitter:  Contracts.Kernel.EventDispatcher = app.get<Contracts.Kernel.EventDispatcher>(Identifiers.EventDispatcherService);

            const spy = jest.spyOn(emitter, 'dispatch');

            handler.emitEvents(bridgechainResignationTransaction, emitter);

            expect(spy).toHaveBeenCalledWith(MagistrateApplicationEvents.BridgechainResigned, expect.anything());
        });
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotBeApplied(bridgechainResignationTransaction, senderWallet, walletRepository)).toResolve();
        });

        it("should throw if wallet is not business", async () => {
            senderWallet.forgetAttribute("business");
            await expect(handler.throwIfCannotBeApplied(bridgechainResignationTransaction, senderWallet, walletRepository)).rejects.toThrowError(WalletIsNotBusinessError);
        });

        it("should throw if business is resigned", async () => {
            senderWallet.setAttribute("business.resigned", true);
            await expect(handler.throwIfCannotBeApplied(bridgechainResignationTransaction, senderWallet, walletRepository)).rejects.toThrowError(BusinessIsResignedError);
        });

        it("should throw if wallet has no registered bridgechains", async () => {
            let businessAttributes = senderWallet.getAttribute("business");
            delete businessAttributes.bridgechains;

            senderWallet.setAttribute("business", businessAttributes);
            await expect(handler.throwIfCannotBeApplied(bridgechainResignationTransaction, senderWallet, walletRepository)).rejects.toThrowError(BridgechainIsNotRegisteredByWalletError);
        });

        it("should throw if bridgechain is not registered", async () => {
            bridgechainResignationTransaction = new BridgechainResignationBuilder()
                .bridgechainResignationAsset("6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b")
                .nonce("1")
                .sign(passphrases[0])
                .build();

            await expect(handler.throwIfCannotBeApplied(bridgechainResignationTransaction, senderWallet, walletRepository)).rejects.toThrowError(BridgechainIsNotRegisteredByWalletError);
        });

        it("should throw if bridgechain is resigned", async () => {
            let businessAttributes = senderWallet.getAttribute("business");
            businessAttributes.bridgechains[bridgechainRegistrationAsset.genesisHash].resigned = true;

            senderWallet.setAttribute("business", businessAttributes);
            await expect(handler.throwIfCannotBeApplied(bridgechainResignationTransaction, senderWallet, walletRepository)).rejects.toThrowError(BridgechainIsResignedError);
        });

        it("should throw if transaction asset is missing", async () => {
            delete bridgechainResignationTransaction.data.asset;

            await expect(handler.throwIfCannotBeApplied(bridgechainResignationTransaction, senderWallet, walletRepository)).rejects.toThrowError()
        });

        it("should throw if wallet has insufficient balance", async () => {
            senderWallet.balance = Utils.BigNumber.ZERO;
            await expect(handler.throwIfCannotBeApplied(bridgechainResignationTransaction, senderWallet, walletRepository)).rejects.toThrowError(InsufficientBalanceError);
        });
    });


    describe("throwIfCannotEnterPool", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotEnterPool(bridgechainResignationTransaction)).toResolve();
        });

        it("should throw if transaction by sender already in pool", async () => {
            await app.get<Memory>(Identifiers.TransactionPoolMemory).addTransaction(bridgechainResignationTransaction);

            await expect(handler.throwIfCannotEnterPool(bridgechainResignationTransaction)).rejects.toThrow(Contracts.TransactionPool.PoolError);
        });
    });

    describe("apply", () => {
        it("should be ok", async () => {
            const senderBalance = senderWallet.balance;

            await handler.apply(bridgechainResignationTransaction, walletRepository);

            expect(senderWallet.getAttribute("business.bridgechains")[bridgechainRegistrationAsset.genesisHash].resigned).toBeTrue();

            expect(senderWallet.balance).toEqual(Utils.BigNumber.make(senderBalance)
                .minus(bridgechainResignationTransaction.data.amount)
                .minus(bridgechainResignationTransaction.data.fee));
        });

        it("should throw if transaction asset is missing", async () => {
            delete bridgechainResignationTransaction.data.asset;

            await expect(handler.apply(bridgechainResignationTransaction, walletRepository)).rejects.toThrowError()
        });
    });

    describe("revert", () => {
        it("should be ok", async () => {
            const senderBalance = senderWallet.balance;

            await handler.apply(bridgechainResignationTransaction, walletRepository);

            expect(senderWallet.getAttribute("business.bridgechains")[bridgechainRegistrationAsset.genesisHash].resigned).toBeTrue();

            await handler.revert(bridgechainResignationTransaction, walletRepository);

            expect(senderWallet.getAttribute("business.bridgechains")[bridgechainRegistrationAsset.genesisHash].resigned).toBeFalse();

            expect(senderWallet.balance).toEqual(Utils.BigNumber.make(senderBalance));
        });

        it("should throw if transaction asset is missing", async () => {
            await handler.apply(bridgechainResignationTransaction, walletRepository);

            expect(senderWallet.getAttribute("business.bridgechains")[bridgechainRegistrationAsset.genesisHash].resigned).toBeTrue();

            delete bridgechainResignationTransaction.data.asset;

            await expect(handler.revert(bridgechainResignationTransaction, walletRepository)).rejects.toThrowError()
        });
    });
});
