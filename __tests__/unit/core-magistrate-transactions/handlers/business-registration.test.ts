import "jest-extended";

import _ from "lodash";

import { buildSenderWallet, initApp } from "../__support__/app";
import { CryptoSuite, Interfaces as BlockInterfaces } from "../../../../packages/core-crypto";
import { Application, Contracts } from "../../../../packages/core-kernel";
import { Identifiers } from "../../../../packages/core-kernel/src/ioc";
import { Enums, Transactions as MagistrateTransactions } from "../../../../packages/core-magistrate-crypto";
import { BusinessRegistrationBuilder } from "../../../../packages/core-magistrate-crypto/src/builders";
import { BusinessAlreadyRegisteredError } from "../../../../packages/core-magistrate-transactions/src/errors";
import { MagistrateApplicationEvents } from "../../../../packages/core-magistrate-transactions/src/events";
import { BusinessRegistrationTransactionHandler } from "../../../../packages/core-magistrate-transactions/src/handlers";
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

    transactionHandlerRegistry = app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    factoryBuilder = new FactoryBuilder(crypto);
    Factories.registerWalletFactory(factoryBuilder);

    senderWallet = buildSenderWallet(app, crypto.CryptoManager);

    walletRepository.index(senderWallet);
});

describe("BusinessRegistration", () => {
    let businessRegistrationTransaction: Interfaces.ITransaction;
    let handler: TransactionHandler;
    const businessRegistrationAsset = _.cloneDeep(Assets.businessRegistrationAsset);

    beforeEach(async () => {
        handler = transactionHandlerRegistry.getRegisteredHandlerByType(
            Transactions.InternalTransactionType.from(
                Enums.MagistrateTransactionType.BusinessRegistration,
                Enums.MagistrateTransactionGroup,
            ),
            2,
        );

        businessRegistrationTransaction = new BusinessRegistrationBuilder(
            crypto.CryptoManager,
            crypto.TransactionManager.TransactionFactory,
            crypto.TransactionManager.TransactionTools,
        )
            .businessRegistrationAsset(businessRegistrationAsset)
            .nonce("1")
            .sign(passphrases[0])
            .build();
    });

    afterEach(() => {
        try {
            crypto.TransactionManager.TransactionTools.TransactionRegistry.deregisterTransactionType(
                MagistrateTransactions.BusinessRegistrationTransaction,
            );
        } catch {}
    });

    describe("bootstrap", () => {
        it("should resolve", async () => {
            Mocks.TransactionRepository.setTransactions([
                Mapper.mapTransactionToModel(businessRegistrationTransaction),
            ]);

            await expect(handler.bootstrap()).toResolve();

            expect(senderWallet.getAttribute("business.businessAsset")).toEqual(businessRegistrationAsset);
        });
    });

    describe("emitEvents", () => {
        it("should dispatch", async () => {
            const emitter: Contracts.Kernel.EventDispatcher = app.get<Contracts.Kernel.EventDispatcher>(
                Identifiers.EventDispatcherService,
            );

            const spy = jest.spyOn(emitter, "dispatch");

            handler.emitEvents(businessRegistrationTransaction, emitter);

            expect(spy).toHaveBeenCalledWith(MagistrateApplicationEvents.BusinessRegistered, expect.anything());
        });
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", async () => {
            await expect(
                handler.throwIfCannotBeApplied(businessRegistrationTransaction, senderWallet, walletRepository),
            ).toResolve();
        });

        it("should throw if business already registered", async () => {
            senderWallet.setAttribute("business", {});
            await expect(
                handler.throwIfCannotBeApplied(businessRegistrationTransaction, senderWallet, walletRepository),
            ).rejects.toThrowError(BusinessAlreadyRegisteredError);
        });

        it("should throw if wallet has insufficient balance", async () => {
            senderWallet.balance = crypto.CryptoManager.LibraryManager.Libraries.BigNumber.ZERO;
            await expect(
                handler.throwIfCannotBeApplied(businessRegistrationTransaction, senderWallet, walletRepository),
            ).rejects.toThrowError(InsufficientBalanceError);
        });
    });

    describe("throwIfCannotEnterPool", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotEnterPool(businessRegistrationTransaction)).toResolve();
        });

        it("should throw if transaction by sender already in pool", async () => {
            await app.get<Mempool>(Identifiers.TransactionPoolMempool).addTransaction(businessRegistrationTransaction);

            await expect(handler.throwIfCannotEnterPool(businessRegistrationTransaction)).rejects.toThrow(
                Contracts.TransactionPool.PoolError,
            );
        });
    });

    describe("apply", () => {
        it("should be ok", async () => {
            const senderBalance = senderWallet.balance;

            await handler.apply(businessRegistrationTransaction, walletRepository);

            expect(senderWallet.hasAttribute("business")).toBeTrue();
            expect(senderWallet.getAttribute("business.businessAsset")).toEqual(businessRegistrationAsset);

            expect(senderWallet.balance).toEqual(
                crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make(senderBalance)
                    .minus(businessRegistrationTransaction.data.amount)
                    .minus(businessRegistrationTransaction.data.fee),
            );

            expect(walletRepository.findByIndex(MagistrateIndex.Businesses, senderWallet.publicKey!)).toEqual(
                senderWallet,
            );
        });

        it("should throw if transaction asset is missing", async () => {
            delete businessRegistrationTransaction.data.asset;

            await expect(handler.apply(businessRegistrationTransaction, walletRepository)).rejects.toThrowError();
        });
    });

    describe("revert", () => {
        it("should be ok", async () => {
            const senderBalance = senderWallet.balance;

            await handler.apply(businessRegistrationTransaction, walletRepository);

            expect(senderWallet.hasAttribute("business")).toBeTrue();

            await handler.revert(businessRegistrationTransaction, walletRepository);

            expect(senderWallet.hasAttribute("business")).toBeFalse();
            expect(senderWallet.balance).toEqual(
                crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make(senderBalance),
            );

            expect(() => {
                walletRepository.findByIndex(MagistrateIndex.Businesses, senderWallet.publicKey!);
            }).toThrowError();
        });
    });
});
