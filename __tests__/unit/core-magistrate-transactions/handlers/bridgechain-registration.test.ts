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
import { configManager } from "@arkecosystem/crypto/src/managers";
import { buildSenderWallet, initApp } from "../__support__/app";
import { setMockTransaction } from "../__mocks__/transaction-repository";
import { BridgechainRegistrationBuilder } from "@arkecosystem/core-magistrate-crypto/src/builders";
import {
    IBridgechainRegistrationAsset,
    IBusinessRegistrationAsset,
} from "@arkecosystem/core-magistrate-crypto/src/interfaces";
import { Enums, Transactions as MagistrateTransactions } from "@arkecosystem/core-magistrate-crypto";
import { Handlers } from "@arkecosystem/core-magistrate-transactions";
import { MagistrateApplicationEvents } from "@arkecosystem/core-magistrate-transactions/src/events";
import { InsufficientBalanceError } from "@arkecosystem/core-transactions/dist/errors";
import {
    BridgechainAlreadyRegisteredError,
    BusinessIsResignedError, GenesisHashAlreadyRegisteredError,
    WalletIsNotBusinessError,
} from "@arkecosystem/core-magistrate-transactions/dist/errors";
import { setMockBlock } from "../__mocks__/block-repository";

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

    transactionHandlerRegistry = app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    factoryBuilder = new FactoryBuilder();
    Factories.registerWalletFactory(factoryBuilder);

    senderWallet = buildSenderWallet(app);

    walletRepository.index(senderWallet);
});

describe("BusinessRegistration", () => {
    let bridgechainRegistrationTransaction: Interfaces.ITransaction;
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
        handler = transactionHandlerRegistry.getRegisteredHandlerByType(Transactions.InternalTransactionType.from(Enums.MagistrateTransactionType.BridgechainRegistration, Enums.MagistrateTransactionGroup), 2);

        bridgechainRegistrationTransaction = new BridgechainRegistrationBuilder()
            .bridgechainRegistrationAsset(bridgechainRegistrationAsset)
            .nonce("1")
            .sign(passphrases[0])
            .build();

        senderWallet.setAttribute("business.businessAsset", businessRegistrationAsset);

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
        } catch {}
    });

    describe("bootstrap", () => {
        afterEach(() => {
            setMockBlock(null);
        });

        it("should resolve", async () => {
            setMockTransaction(bridgechainRegistrationTransaction);
            await expect(handler.bootstrap()).toResolve();

            expect(senderWallet.getAttribute("business.bridgechains")[bridgechainRegistrationAsset.genesisHash].bridgechainAsset).toEqual(bridgechainRegistrationAsset);
        });
    });

    describe("emitEvents", () => {
        it("should dispatch", async () => {
            let emitter:  Contracts.Kernel.EventDispatcher = app.get<Contracts.Kernel.EventDispatcher>(Identifiers.EventDispatcherService);

            const spy = jest.spyOn(emitter, 'dispatch');

            handler.emitEvents(bridgechainRegistrationTransaction, emitter);

            expect(spy).toHaveBeenCalledWith(MagistrateApplicationEvents.BridgechainRegistered, expect.anything());
        });
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotBeApplied(bridgechainRegistrationTransaction, senderWallet, walletRepository)).toResolve();
        });

        // TODO: Add exception

        it("should throw if wallet is not business", async () => {
            senderWallet.forgetAttribute("business");
            await expect(handler.throwIfCannotBeApplied(bridgechainRegistrationTransaction, senderWallet, walletRepository)).rejects.toThrowError(WalletIsNotBusinessError);
        });

        it("should throw if business is resigned", async () => {
            senderWallet.setAttribute("business.resigned", true);
            await expect(handler.throwIfCannotBeApplied(bridgechainRegistrationTransaction, senderWallet, walletRepository)).rejects.toThrowError(BusinessIsResignedError);
        });


        it("should throw if bridgechain is already registered", async () => {
            bridgechainRegistrationAsset.genesisHash = "6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b";

            let businessAttributes = {
                bridgechains: {}
            };

            businessAttributes.bridgechains[bridgechainRegistrationAsset.genesisHash] = {
                bridgechainAsset: bridgechainRegistrationAsset,
            };

            senderWallet.setAttribute("business", businessAttributes);

            walletRepository.index(senderWallet);

            await expect(handler.throwIfCannotBeApplied(bridgechainRegistrationTransaction, senderWallet, walletRepository)).rejects.toThrowError(BridgechainAlreadyRegisteredError);
        });

        it("should throw if genesis hash is already registered", async () => {
            let businessAttributes = {
                bridgechains: {}
            };

            businessAttributes.bridgechains[bridgechainRegistrationAsset.genesisHash] = {
                bridgechainAsset: bridgechainRegistrationAsset,
            };

            senderWallet.setAttribute("business", businessAttributes);

            walletRepository.index(senderWallet);

            await expect(handler.throwIfCannotBeApplied(bridgechainRegistrationTransaction, senderWallet, walletRepository)).rejects.toThrowError(GenesisHashAlreadyRegisteredError);
        });

        it("should throw if wallet has insufficient balance", async () => {
            senderWallet.balance = Utils.BigNumber.ZERO;
            await expect(handler.throwIfCannotBeApplied(bridgechainRegistrationTransaction, senderWallet, walletRepository)).rejects.toThrowError(InsufficientBalanceError);
        });
    });

    describe("throwIfCannotEnterPool", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotEnterPool(bridgechainRegistrationTransaction)).toResolve();
        });
    });

    describe("apply", () => {
        it("should be ok", async () => {
            const senderBalance = senderWallet.balance;

            await handler.apply(bridgechainRegistrationTransaction, walletRepository);

            expect(senderWallet.getAttribute("business.bridgechains")[bridgechainRegistrationAsset.genesisHash].bridgechainAsset).toEqual(bridgechainRegistrationAsset);

            expect(senderWallet.balance).toEqual(Utils.BigNumber.make(senderBalance)
                .minus(bridgechainRegistrationTransaction.data.amount)
                .minus(bridgechainRegistrationTransaction.data.fee));
        });
    });

    describe("revert", () => {
        it("should be ok", async () => {
            const senderBalance = senderWallet.balance;

            await handler.apply(bridgechainRegistrationTransaction, walletRepository);

            expect(senderWallet.getAttribute("business.bridgechains")[bridgechainRegistrationAsset.genesisHash].bridgechainAsset).toEqual(bridgechainRegistrationAsset);

            await handler.revert(bridgechainRegistrationTransaction, walletRepository);

            expect(senderWallet.hasAttribute("business.bridgechains")[bridgechainRegistrationAsset.genesisHash]).toBeUndefined();

            expect(senderWallet.balance).toEqual(Utils.BigNumber.make(senderBalance));
        });
    });
});
