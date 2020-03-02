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
import { BusinessRegistrationBuilder, BusinessUpdateBuilder } from "@arkecosystem/core-magistrate-crypto/src/builders";
import { IBusinessRegistrationAsset, IBusinessUpdateAsset } from "@arkecosystem/core-magistrate-crypto/src/interfaces";
import { Enums, Transactions as MagistrateTransactions } from "@arkecosystem/core-magistrate-crypto";
import { Handlers } from "@arkecosystem/core-magistrate-transactions";
import { MagistrateApplicationEvents } from "@arkecosystem/core-magistrate-transactions/src/events";
import { setMockBlock } from "./__mocks__/block-repository";
import { InsufficientBalanceError } from "@arkecosystem/core-transactions/dist/errors";
import {
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
    app.bind(Identifiers.TransactionHandler).to(Handlers.BusinessUpdateTransactionHandler);

    transactionHandlerRegistry = app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    factoryBuilder = new FactoryBuilder();
    Factories.registerWalletFactory(factoryBuilder);

    senderWallet = buildSenderWallet(app);

    walletRepository.reindex(senderWallet);
});

describe("BusinessRegistration", () => {
    let businessUpdateTransaction: Interfaces.ITransaction;
    let handler: TransactionHandler;

    let businessRegistrationAsset: IBusinessRegistrationAsset = {
        name: "DummyBusiness",
        website: "https://www.dummy.example",
        vat: "EX1234567890",
        repository: "https://www.dummy.example/repo"
    };

    let businessUpdateAsset: IBusinessUpdateAsset = {
        name: "DummyBusinessUpdated",
        website: "https://www.dummy.example.updated",
        vat: "UEX1234567890",
        repository: "https://www.dummy.example/repo/updated"
    };

    beforeEach(async () => {
        handler = transactionHandlerRegistry.getRegisteredHandlerByType(Transactions.InternalTransactionType.from(Enums.MagistrateTransactionType.BusinessUpdate, Enums.MagistrateTransactionGroup), 2);

        businessUpdateTransaction = new BusinessUpdateBuilder()
            .businessUpdateAsset(businessUpdateAsset)
            .nonce("1")
            .sign(passphrases[0])
            .build();

        senderWallet.setAttribute("business.businessAsset", businessRegistrationAsset);

        walletRepository.reindex(senderWallet);
    });

    afterEach(() => {
        try {
            Transactions.TransactionRegistry.deregisterTransactionType(
                MagistrateTransactions.BusinessRegistrationTransaction,
            );
            Transactions.TransactionRegistry.deregisterTransactionType(
                MagistrateTransactions.BusinessUpdateTransaction,
            );
        } catch {}
    });

    describe("bootstrap", () => {
        afterEach(() => {
            setMockBlock(null);
        });

        it("should resolve", async () => {
            setMockTransaction(businessUpdateTransaction);
            await expect(handler.bootstrap()).toResolve();

            expect(senderWallet.getAttribute("business.businessAsset")).toEqual(businessUpdateAsset);
        });
    });

    describe("emitEvents", () => {
        it("should dispatch", async () => {
            let emitter:  Contracts.Kernel.EventDispatcher = app.get<Contracts.Kernel.EventDispatcher>(Identifiers.EventDispatcherService);

            const spy = jest.spyOn(emitter, 'dispatch');

            handler.emitEvents(businessUpdateTransaction, emitter);

            expect(spy).toHaveBeenCalledWith(MagistrateApplicationEvents.BusinessUpdate, expect.anything());
        });
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotBeApplied(businessUpdateTransaction, senderWallet, walletRepository)).toResolve();
        });

        it("should throw if business is not registered", async () => {
            senderWallet.forgetAttribute("business");
            await expect(handler.throwIfCannotBeApplied(businessUpdateTransaction, senderWallet, walletRepository)).rejects.toThrow(BusinessIsNotRegisteredError);
        });

        it("should throw if business is resigned", async () => {
            senderWallet.setAttribute("business.resigned", true);
            await expect(handler.throwIfCannotBeApplied(businessUpdateTransaction, senderWallet, walletRepository)).rejects.toThrow(BusinessIsResignedError);
        });

        it("should throw if wallet has insufficient balance", async () => {
            senderWallet.balance = Utils.BigNumber.ZERO;
            await expect(handler.throwIfCannotBeApplied(businessUpdateTransaction, senderWallet, walletRepository)).rejects.toThrowError(InsufficientBalanceError);
        });
    });

    describe("throwIfCannotEnterPool", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotEnterPool(businessUpdateTransaction)).toResolve();
        });

        it("should throw if transaction by sender already in pool", async () => {
            await app.get<Memory>(Identifiers.TransactionPoolMemory).addTransaction(businessUpdateTransaction);

            await expect(handler.throwIfCannotEnterPool(businessUpdateTransaction)).rejects.toThrow(Contracts.TransactionPool.PoolError);
        });
    });

    describe("apply", () => {
        it("should be ok", async () => {
            const senderBalance = senderWallet.balance;

            await handler.apply(businessUpdateTransaction, walletRepository);

            expect(senderWallet.getAttribute("business.businessAsset")).toEqual(businessUpdateAsset);

            expect(senderWallet.balance).toEqual(Utils.BigNumber.make(senderBalance)
                .minus(businessUpdateTransaction.data.amount)
                .minus(businessUpdateTransaction.data.fee));
        });
    });
    describe("revert", () => {
        afterEach(() => {
            // @ts-ignore
            setMockTransactions([])
        });

        it("should be ok", async () => {
            const senderBalance = senderWallet.balance;

            await handler.apply(businessUpdateTransaction, walletRepository);

            expect(senderWallet.getAttribute("business.businessAsset")).toEqual(businessUpdateAsset);

            let businessRegistrationTransaction = new BusinessRegistrationBuilder()
                .businessRegistrationAsset(businessRegistrationAsset)
                .nonce("1")
                .sign(passphrases[0])
                .build();

            setMockTransactions([businessRegistrationTransaction]);
            await handler.revert(businessUpdateTransaction, walletRepository);

            expect(senderWallet.getAttribute("business.businessAsset")).toEqual(businessRegistrationAsset);
            expect(senderWallet.balance).toEqual(Utils.BigNumber.make(senderBalance));
        });

        it("should be ok with second update transaction", async () => {
            senderWallet.setAttribute("business.businessAsset", {
                ...businessRegistrationAsset,
                ...businessUpdateAsset
            });

            const senderBalance = senderWallet.balance;

            let businessRegistrationTransaction = new BusinessRegistrationBuilder()
                .businessRegistrationAsset(businessRegistrationAsset)
                .nonce("1")
                .sign(passphrases[0])
                .build();

            let secondBusinessUpdateAsset: IBusinessUpdateAsset = {
                name: "DummyBusinessSecond",
                website: "https://www.dummy.example.second",
                vat: "EX1234567890S",
                repository: "https://www.dummy.example/repo/second"
            };

            let secondBusinessUpdateTransaction = new BusinessUpdateBuilder()
                .businessUpdateAsset(secondBusinessUpdateAsset)
                .nonce("1")
                .sign(passphrases[0])
                .build();

            await handler.apply(secondBusinessUpdateTransaction, walletRepository);

            expect(senderWallet.getAttribute("business.businessAsset")).toEqual({
                ...businessRegistrationAsset,
                ...businessUpdateAsset,
                ...secondBusinessUpdateAsset,
            });

            // @ts-ignore
            setMockTransactions([businessRegistrationTransaction, businessUpdateTransaction]);
            await handler.revert(secondBusinessUpdateTransaction, walletRepository);

            expect(senderWallet.getAttribute("business.businessAsset")).toEqual({
                ...businessRegistrationAsset,
                ...businessUpdateAsset
            });
            expect(senderWallet.balance).toEqual(Utils.BigNumber.make(senderBalance));
        });
    });
});
