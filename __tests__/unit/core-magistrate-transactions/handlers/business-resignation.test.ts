import "jest-extended";

import { Application, Contracts } from "@arkecosystem/core-kernel";
import { Identifiers } from "@arkecosystem/core-kernel/src/ioc";
import { Enums, Transactions as MagistrateTransactions } from "@arkecosystem/core-magistrate-crypto";
import { BusinessResignationBuilder } from "@arkecosystem/core-magistrate-crypto/src/builders";
import { IBusinessRegistrationAsset } from "@arkecosystem/core-magistrate-crypto/src/interfaces";
import {
    BusinessIsNotRegisteredError,
    BusinessIsResignedError,
} from "@arkecosystem/core-magistrate-transactions/src/errors";
import { MagistrateApplicationEvents } from "@arkecosystem/core-magistrate-transactions/src/events";
import {
    BusinessRegistrationTransactionHandler,
    BusinessResignationTransactionHandler,
} from "@arkecosystem/core-magistrate-transactions/src/handlers";
import { MagistrateIndex } from "@arkecosystem/core-magistrate-transactions/src/wallet-indexes";
import { Wallets } from "@arkecosystem/core-state";
import { StateStore } from "@arkecosystem/core-state/src/stores/state";
import { Generators } from "@arkecosystem/core-test-framework/src";
import { Factories, FactoryBuilder } from "@arkecosystem/core-test-framework/src/factories";
import passphrases from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { Memory } from "@arkecosystem/core-transaction-pool";
import { InsufficientBalanceError } from "@arkecosystem/core-transactions/dist/errors";
import { TransactionHandler } from "@arkecosystem/core-transactions/src/handlers";
import { TransactionHandlerRegistry } from "@arkecosystem/core-transactions/src/handlers/handler-registry";
import { Crypto, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { configManager } from "@arkecosystem/crypto/src/managers";

import { buildSenderWallet, initApp } from "../__support__/app";
import { setMockBlock } from "../mocks/block-repository";
import { setMockTransaction } from "../mocks/transaction-repository";

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

    setMockTransaction(null);

    app = initApp();

    app.bind(Identifiers.TransactionHandler).to(BusinessRegistrationTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(BusinessResignationTransactionHandler);

    transactionHandlerRegistry = app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    factoryBuilder = new FactoryBuilder();
    Factories.registerWalletFactory(factoryBuilder);

    senderWallet = buildSenderWallet(app);

    walletRepository.index(senderWallet);
});

describe("BusinessRegistration", () => {
    let businessResignationTransaction: Interfaces.ITransaction;
    let handler: TransactionHandler;
    const businessRegistrationAsset: IBusinessRegistrationAsset = {
        name: "DummyBusiness",
        website: "https://www.dummy.example",
        vat: "EX1234567890",
        repository: "https://www.dummy.example/repo",
    };

    beforeEach(async () => {
        handler = transactionHandlerRegistry.getRegisteredHandlerByType(
            Transactions.InternalTransactionType.from(
                Enums.MagistrateTransactionType.BusinessResignation,
                Enums.MagistrateTransactionGroup,
            ),
            2,
        );

        businessResignationTransaction = new BusinessResignationBuilder()
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
                MagistrateTransactions.BusinessResignationTransaction,
            );
        } catch {}
    });

    describe("bootstrap", () => {
        afterEach(() => {
            setMockBlock(null);
        });

        it("should resolve", async () => {
            setMockTransaction(businessResignationTransaction);
            await expect(handler.bootstrap()).toResolve();

            expect(senderWallet.getAttribute("business.resigned")).toBeTrue();
        });
    });

    describe("emitEvents", () => {
        it("should dispatch", async () => {
            const emitter: Contracts.Kernel.EventDispatcher = app.get<Contracts.Kernel.EventDispatcher>(
                Identifiers.EventDispatcherService,
            );

            const spy = jest.spyOn(emitter, "dispatch");

            handler.emitEvents(businessResignationTransaction, emitter);

            expect(spy).toHaveBeenCalledWith(MagistrateApplicationEvents.BusinessResigned, expect.anything());
        });
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", async () => {
            await expect(
                handler.throwIfCannotBeApplied(businessResignationTransaction, senderWallet, walletRepository),
            ).toResolve();
        });

        it("should throw if business is not registered", async () => {
            senderWallet.forgetAttribute("business");
            await expect(
                handler.throwIfCannotBeApplied(businessResignationTransaction, senderWallet, walletRepository),
            ).rejects.toThrow(BusinessIsNotRegisteredError);
        });

        it("should throw if business is resigned", async () => {
            senderWallet.setAttribute("business.resigned", true);
            await expect(
                handler.throwIfCannotBeApplied(businessResignationTransaction, senderWallet, walletRepository),
            ).rejects.toThrow(BusinessIsResignedError);
        });

        it("should throw if wallet has insufficient balance", async () => {
            senderWallet.balance = Utils.BigNumber.ZERO;
            await expect(
                handler.throwIfCannotBeApplied(businessResignationTransaction, senderWallet, walletRepository),
            ).rejects.toThrowError(InsufficientBalanceError);
        });
    });

    describe("throwIfCannotEnterPool", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotEnterPool(businessResignationTransaction)).toResolve();
        });

        it("should throw if transaction by sender already in pool", async () => {
            await app.get<Memory>(Identifiers.TransactionPoolMemory).addTransaction(businessResignationTransaction);

            await expect(handler.throwIfCannotEnterPool(businessResignationTransaction)).rejects.toThrow(
                Contracts.TransactionPool.PoolError,
            );
        });
    });

    describe("apply", () => {
        it("should be ok", async () => {
            const senderBalance = senderWallet.balance;

            expect(walletRepository.findByIndex(MagistrateIndex.Businesses, senderWallet.publicKey!)).toEqual(
                senderWallet,
            );

            await handler.apply(businessResignationTransaction, walletRepository);

            expect(senderWallet.hasAttribute("business")).toBeTrue();
            expect(senderWallet.getAttribute("business.resigned")).toBeTrue();

            expect(senderWallet.balance).toEqual(
                Utils.BigNumber.make(senderBalance)
                    .minus(businessResignationTransaction.data.amount)
                    .minus(businessResignationTransaction.data.fee),
            );

            expect(walletRepository.findByIndex(MagistrateIndex.Businesses, senderWallet.publicKey!)).toEqual(
                senderWallet,
            );
        });
    });

    describe("revert", () => {
        it("should be ok", async () => {
            const senderBalance = senderWallet.balance;

            await handler.apply(businessResignationTransaction, walletRepository);

            expect(senderWallet.getAttribute("business.resigned")).toBeTrue();

            await handler.revert(businessResignationTransaction, walletRepository);

            expect(senderWallet.hasAttribute("business.resigned")).toBeFalse();
            expect(senderWallet.balance).toEqual(Utils.BigNumber.make(senderBalance));
        });
    });
});
