import "jest-extended";

import _ from "lodash";

import { buildSenderWallet, initApp } from "../__support__/app";
import { Application, Contracts } from "../../../../packages/core-kernel";
import { Identifiers } from "../../../../packages/core-kernel/src/ioc";
import { Enums, Transactions as MagistrateTransactions } from "../../../../packages/core-magistrate-crypto";
import { BusinessResignationBuilder } from "../../../../packages/core-magistrate-crypto/src/builders";
import {
    BusinessIsNotRegisteredError,
    BusinessIsResignedError,
} from "../../../../packages/core-magistrate-transactions/src/errors";
import { MagistrateApplicationEvents } from "../../../../packages/core-magistrate-transactions/src/events";
import {
    BusinessRegistrationTransactionHandler,
    BusinessResignationTransactionHandler,
} from "../../../../packages/core-magistrate-transactions/src/handlers";
import { MagistrateIndex } from "../../../../packages/core-magistrate-transactions/src/wallet-indexes";
import { Wallets } from "../../../../packages/core-state";
import { StateStore } from "../../../../packages/core-state/src/stores/state";
import { Mapper, Mocks } from "../../../../packages/core-test-framework/src";
import { Generators } from "../../../../packages/core-test-framework/src";
import { Factories, FactoryBuilder } from "../../../../packages/core-test-framework/src/factories";
import passphrases from "../../../../packages/core-test-framework/src/internal/passphrases.json";
import { Mempool } from "../../../../packages/core-transaction-pool";
import { InsufficientBalanceError } from "../../../../packages/core-transactions/dist/errors";
import { TransactionHandler } from "../../../../packages/core-transactions/src/handlers";
import { TransactionHandlerRegistry } from "../../../../packages/core-transactions/src/handlers/handler-registry";
import { Assets } from "./__fixtures__";

let app: Application;
let senderWallet: Contracts.State.Wallet;
let walletRepository: Contracts.State.WalletRepository;
let factoryBuilder: FactoryBuilder;
let transactionHandlerRegistry: TransactionHandlerRegistry;
import { CryptoSuite, Interfaces as BlockInterfaces } from "../../../../packages/core-crypto";
import { Interfaces, Transactions } from "../../../../packages/crypto";

let crypto: CryptoSuite.CryptoSuite;

let mockLastBlockData: Partial<BlockInterfaces.IBlockData>;
let mockGetLastBlock;

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
    app.bind(Identifiers.TransactionHandler).to(BusinessResignationTransactionHandler);

    transactionHandlerRegistry = app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    factoryBuilder = new FactoryBuilder(crypto);
    Factories.registerWalletFactory(factoryBuilder);

    senderWallet = buildSenderWallet(app, crypto.CryptoManager);

    walletRepository.index(senderWallet);
});

describe("BusinessRegistration", () => {
    let businessResignationTransaction: Interfaces.ITransaction;
    let handler: TransactionHandler;
    const businessRegistrationAsset = _.cloneDeep(Assets.businessRegistrationAsset);

    beforeEach(async () => {
        handler = transactionHandlerRegistry.getRegisteredHandlerByType(
            Transactions.InternalTransactionType.from(
                Enums.MagistrateTransactionType.BusinessResignation,
                Enums.MagistrateTransactionGroup,
            ),
            2,
        );

        businessResignationTransaction = new BusinessResignationBuilder(
            crypto.CryptoManager,
            crypto.TransactionManager.TransactionFactory,
            crypto.TransactionManager.TransactionTools,
        )
            .nonce("1")
            .sign(passphrases[0])
            .build();

        senderWallet.setAttribute("business.businessAsset", businessRegistrationAsset);

        walletRepository.index(senderWallet);
    });

    afterEach(() => {
        try {
            crypto.TransactionManager.TransactionTools.TransactionRegistry.deregisterTransactionType(
                MagistrateTransactions.BusinessRegistrationTransaction,
            );
            crypto.TransactionManager.TransactionTools.TransactionRegistry.deregisterTransactionType(
                MagistrateTransactions.BusinessResignationTransaction,
            );
        } catch {}
    });

    describe("bootstrap", () => {
        it("should resolve", async () => {
            Mocks.TransactionRepository.setTransactions([Mapper.mapTransactionToModel(businessResignationTransaction)]);
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
            senderWallet.balance = crypto.CryptoManager.LibraryManager.Libraries.BigNumber.ZERO;
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
            await app.get<Mempool>(Identifiers.TransactionPoolMempool).addTransaction(businessResignationTransaction);

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
                crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make(senderBalance)
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
            expect(senderWallet.balance).toEqual(
                crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make(senderBalance),
            );
        });
    });
});
