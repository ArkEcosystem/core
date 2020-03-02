import "jest-extended";

import passphrases from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { Contracts, Application } from "@arkecosystem/core-kernel";
import { Crypto, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { FactoryBuilder, Factories } from "@arkecosystem/core-test-framework/src/factories";
import { Generators } from "@arkecosystem/core-test-framework/src";
import { Identifiers } from "@arkecosystem/core-kernel/src/ioc";
import { StateStore } from "@arkecosystem/core-state/src/stores/state";
import { TransactionHandler } from "@arkecosystem/core-transactions/src/handlers";
import { TransactionHandlerRegistry } from "@arkecosystem/core-transactions/src/handlers/handler-registry";
import { Wallets } from "@arkecosystem/core-state";
import { configManager } from "@packages/crypto/src/managers";
import {
    buildSenderWallet,
    initApp,
} from "./__support__/app";
import { setMockTransaction } from "./__mocks__/transaction-repository";
// import { setMockBlock } from "../__mocks__/block-repository";
import { BusinessRegistrationBuilder } from "@arkecosystem/core-magistrate-crypto/src/builders";
import { IBusinessRegistrationAsset } from "@arkecosystem/core-magistrate-crypto/src/interfaces";
import { Enums, Transactions as MagistrateTransactions } from "@arkecosystem/core-magistrate-crypto";
import { Handlers } from "@arkecosystem/core-magistrate-transactions";
import { MagistrateApplicationEvents } from "@arkecosystem/core-magistrate-transactions/src/events";
import { setMockBlock } from "./__mocks__/block-repository";
import {
    BusinessAlreadyRegisteredError,
} from "@arkecosystem/core-magistrate-transactions/dist/errors";
import { InsufficientBalanceError } from "@arkecosystem/core-transactions/dist/errors";
import { Memory } from "@arkecosystem/core-transaction-pool";
import { MagistrateIndex } from "@arkecosystem/core-magistrate-transactions/src/wallet-indexes";

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

    transactionHandlerRegistry = app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    factoryBuilder = new FactoryBuilder();
    Factories.registerWalletFactory(factoryBuilder);

    senderWallet = buildSenderWallet(app);

    walletRepository.index(senderWallet);
});

describe("BusinessRegistration", () => {
    let businessRegistrationTransaction: Interfaces.ITransaction;
    let handler: TransactionHandler;
    let businessRegistrationAsset: IBusinessRegistrationAsset = {
        name: "DummyBusiness",
        website: "https://www.dummy.example",
        vat: "EX1234567890",
        repository: "https://www.dummy.example/repo"
    };

    beforeEach(async () => {
        handler = transactionHandlerRegistry.getRegisteredHandlerByType(Transactions.InternalTransactionType.from(Enums.MagistrateTransactionType.BusinessRegistration, Enums.MagistrateTransactionGroup), 2);

        businessRegistrationTransaction = new BusinessRegistrationBuilder()
            .businessRegistrationAsset(businessRegistrationAsset)
            .nonce("1")
            .sign(passphrases[0])
            .build();
    });

    afterEach(() => {
        try {
            Transactions.TransactionRegistry.deregisterTransactionType(
                MagistrateTransactions.BusinessRegistrationTransaction,
            );
        } catch {}
    });

    describe("bootstrap", () => {
        afterEach(() => {
            setMockBlock(null);
        });

        it("should resolve", async () => {
            setMockTransaction(businessRegistrationTransaction);
            await expect(handler.bootstrap()).toResolve();

            expect(senderWallet.getAttribute("business.businessAsset")).toEqual(businessRegistrationAsset);
        });
    });

    describe("emitEvents", () => {
        it("should dispatch", async () => {
            let emitter:  Contracts.Kernel.EventDispatcher = app.get<Contracts.Kernel.EventDispatcher>(Identifiers.EventDispatcherService);

            const spy = jest.spyOn(emitter, 'dispatch');

            handler.emitEvents(businessRegistrationTransaction, emitter);

            expect(spy).toHaveBeenCalledWith(MagistrateApplicationEvents.BusinessRegistered, expect.anything());
        });
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotBeApplied(businessRegistrationTransaction, senderWallet, walletRepository)).toResolve();
        });

        it("should throw if business already registered", async () => {
            senderWallet.setAttribute("business", {});
            await expect(handler.throwIfCannotBeApplied(businessRegistrationTransaction, senderWallet, walletRepository)).rejects.toThrowError(BusinessAlreadyRegisteredError);
        });

        it("should throw if wallet has insufficient balance", async () => {
            senderWallet.balance = Utils.BigNumber.ZERO;
            await expect(handler.throwIfCannotBeApplied(businessRegistrationTransaction, senderWallet, walletRepository)).rejects.toThrowError(InsufficientBalanceError);
        });
    });

    describe("throwIfCannotEnterPool", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotEnterPool(businessRegistrationTransaction)).toResolve();
        });

        it("should throw if transaction by sender already in pool", async () => {
            await app.get<Memory>(Identifiers.TransactionPoolMemory).addTransaction(businessRegistrationTransaction);

            await expect(handler.throwIfCannotEnterPool(businessRegistrationTransaction)).rejects.toThrow(Contracts.TransactionPool.PoolError);
        });
    });

    describe("apply", () => {
        it("should be ok", async () => {
            const senderBalance = senderWallet.balance;

            await handler.apply(businessRegistrationTransaction, walletRepository);

            expect(senderWallet.hasAttribute("business")).toBeTrue();
            expect(senderWallet.getAttribute("business.businessAsset")).toEqual(businessRegistrationAsset);

            expect(senderWallet.balance).toEqual(Utils.BigNumber.make(senderBalance)
                .minus(businessRegistrationTransaction.data.amount)
                .minus(businessRegistrationTransaction.data.fee));

            expect(walletRepository.findByIndex(MagistrateIndex.Businesses, senderWallet.publicKey!)).toEqual(senderWallet);
        });
    });

    describe("revert", () => {
        it("should be ok", async () => {
            const senderBalance = senderWallet.balance;

            await handler.apply(businessRegistrationTransaction, walletRepository);

            expect(senderWallet.hasAttribute("business")).toBeTrue();

            await handler.revert(businessRegistrationTransaction, walletRepository);

            expect(senderWallet.hasAttribute("business")).toBeFalse();
            expect(senderWallet.balance).toEqual(Utils.BigNumber.make(senderBalance));

            expect(() => {walletRepository.findByIndex(MagistrateIndex.Businesses, senderWallet.publicKey!)}).toThrowError();
        });
    });
});
