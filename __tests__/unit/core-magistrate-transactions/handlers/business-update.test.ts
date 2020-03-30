import "jest-extended";

import { Application, Contracts } from "@packages/core-kernel";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { Enums, Transactions as MagistrateTransactions } from "@packages/core-magistrate-crypto";
import { BusinessRegistrationBuilder, BusinessUpdateBuilder } from "@packages/core-magistrate-crypto/src/builders";
import { IBusinessUpdateAsset } from "@packages/core-magistrate-crypto/src/interfaces";
import {
    BusinessIsNotRegisteredError,
    BusinessIsResignedError,
} from "@packages/core-magistrate-transactions/src/errors";
import { MagistrateApplicationEvents } from "@packages/core-magistrate-transactions/src/events";
import {
    BusinessRegistrationTransactionHandler,
    BusinessUpdateTransactionHandler,
} from "@packages/core-magistrate-transactions/src/handlers";
import { Wallets } from "@packages/core-state";
import { StateStore } from "@packages/core-state/src/stores/state";
import { Generators } from "@packages/core-test-framework/src";
import { Factories, FactoryBuilder } from "@packages/core-test-framework/src/factories";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import { Mempool } from "@packages/core-transaction-pool";
import { InsufficientBalanceError } from "@packages/core-transactions/dist/errors";
import { TransactionHandler } from "@packages/core-transactions/src/handlers";
import { TransactionHandlerRegistry } from "@packages/core-transactions/src/handlers/handler-registry";
import { Crypto, Interfaces, Managers, Transactions, Utils } from "@packages/crypto";
import { configManager } from "@packages/crypto/src/managers";

import { buildSenderWallet, initApp } from "../__support__/app";
import { Mocks, Mapper } from "@packages/core-test-framework";
import { Assets } from "./__fixtures__";
import _ from "lodash";

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

    Mocks.TransactionRepository.setTransactions([]);

    app = initApp();

    app.bind(Identifiers.TransactionHandler).to(BusinessRegistrationTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(BusinessUpdateTransactionHandler);

    transactionHandlerRegistry = app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    factoryBuilder = new FactoryBuilder();
    Factories.registerWalletFactory(factoryBuilder);

    senderWallet = buildSenderWallet(app);

    walletRepository.index(senderWallet);
});

describe("BusinessRegistration", () => {
    let businessUpdateTransaction: Interfaces.ITransaction;
    let handler: TransactionHandler;

    const businessRegistrationAsset = _.cloneDeep(Assets.businessRegistrationAsset);
    const businessUpdateAsset = _.cloneDeep(Assets.businessUpdateAsset);

    beforeEach(async () => {
        handler = transactionHandlerRegistry.getRegisteredHandlerByType(
            Transactions.InternalTransactionType.from(
                Enums.MagistrateTransactionType.BusinessUpdate,
                Enums.MagistrateTransactionGroup,
            ),
            2,
        );

        businessUpdateTransaction = new BusinessUpdateBuilder()
            .businessUpdateAsset(businessUpdateAsset)
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
                MagistrateTransactions.BusinessUpdateTransaction,
            );
        } catch {}
    });

    describe("bootstrap", () => {
        it("should resolve", async () => {
            Mocks.TransactionRepository.setTransactions([Mapper.mapTransactionToModel(businessUpdateTransaction)]);
            await expect(handler.bootstrap()).toResolve();

            expect(senderWallet.getAttribute("business.businessAsset")).toEqual(businessUpdateAsset);
        });
    });

    describe("emitEvents", () => {
        it("should dispatch", async () => {
            const emitter: Contracts.Kernel.EventDispatcher = app.get<Contracts.Kernel.EventDispatcher>(
                Identifiers.EventDispatcherService,
            );

            const spy = jest.spyOn(emitter, "dispatch");

            handler.emitEvents(businessUpdateTransaction, emitter);

            expect(spy).toHaveBeenCalledWith(MagistrateApplicationEvents.BusinessUpdate, expect.anything());
        });
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", async () => {
            await expect(
                handler.throwIfCannotBeApplied(businessUpdateTransaction, senderWallet, walletRepository),
            ).toResolve();
        });

        it("should throw if business is not registered", async () => {
            senderWallet.forgetAttribute("business");
            await expect(
                handler.throwIfCannotBeApplied(businessUpdateTransaction, senderWallet, walletRepository),
            ).rejects.toThrow(BusinessIsNotRegisteredError);
        });

        it("should throw if business is resigned", async () => {
            senderWallet.setAttribute("business.resigned", true);
            await expect(
                handler.throwIfCannotBeApplied(businessUpdateTransaction, senderWallet, walletRepository),
            ).rejects.toThrow(BusinessIsResignedError);
        });

        it("should throw if wallet has insufficient balance", async () => {
            senderWallet.balance = Utils.BigNumber.ZERO;
            await expect(
                handler.throwIfCannotBeApplied(businessUpdateTransaction, senderWallet, walletRepository),
            ).rejects.toThrowError(InsufficientBalanceError);
        });
    });

    describe("throwIfCannotEnterPool", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotEnterPool(businessUpdateTransaction)).toResolve();
        });

        it("should throw if transaction by sender already in pool", async () => {
            await app.get<Mempool>(Identifiers.TransactionPoolMempool).addTransaction(businessUpdateTransaction);

            await expect(handler.throwIfCannotEnterPool(businessUpdateTransaction)).rejects.toThrow(
                Contracts.TransactionPool.PoolError,
            );
        });
    });

    describe("apply", () => {
        it("should be ok", async () => {
            const senderBalance = senderWallet.balance;

            await handler.apply(businessUpdateTransaction, walletRepository);

            expect(senderWallet.getAttribute("business.businessAsset")).toEqual(businessUpdateAsset);

            expect(senderWallet.balance).toEqual(
                Utils.BigNumber.make(senderBalance)
                    .minus(businessUpdateTransaction.data.amount)
                    .minus(businessUpdateTransaction.data.fee),
            );
        });
    });
    describe("revert", () => {
        it("should be ok", async () => {
            const senderBalance = senderWallet.balance;

            await handler.apply(businessUpdateTransaction, walletRepository);

            expect(senderWallet.getAttribute("business.businessAsset")).toEqual(businessUpdateAsset);

            const businessRegistrationTransaction = new BusinessRegistrationBuilder()
                .businessRegistrationAsset(businessRegistrationAsset)
                .nonce("1")
                .sign(passphrases[0])
                .build();

            Mocks.TransactionRepository.setTransactions([
                Mapper.mapTransactionToModel(businessRegistrationTransaction),
            ]);

            await handler.revert(businessUpdateTransaction, walletRepository);

            expect(senderWallet.getAttribute("business.businessAsset")).toEqual(businessRegistrationAsset);
            expect(senderWallet.balance).toEqual(Utils.BigNumber.make(senderBalance));
        });

        it("should be ok with second update transaction", async () => {
            senderWallet.setAttribute("business.businessAsset", {
                ...businessRegistrationAsset,
                ...businessUpdateAsset,
            });

            const senderBalance = senderWallet.balance;

            const businessRegistrationTransaction = new BusinessRegistrationBuilder()
                .businessRegistrationAsset(businessRegistrationAsset)
                .nonce("1")
                .sign(passphrases[0])
                .build();

            const secondBusinessUpdateAsset: IBusinessUpdateAsset = {
                name: "DummyBusinessSecond",
                website: "https://www.dummy.example.second",
                vat: "EX1234567890S",
                repository: "https://www.dummy.example/repo/second",
            };

            const secondBusinessUpdateTransaction = new BusinessUpdateBuilder()
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

            Mocks.TransactionRepository.setTransactions([
                Mapper.mapTransactionToModel(businessRegistrationTransaction),
                Mapper.mapTransactionToModel(secondBusinessUpdateTransaction),
                Mapper.mapTransactionToModel(businessUpdateTransaction),
            ]);

            await handler.revert(secondBusinessUpdateTransaction, walletRepository);

            expect(senderWallet.getAttribute("business.businessAsset")).toEqual({
                ...businessRegistrationAsset,
                ...businessUpdateAsset,
            });
            expect(senderWallet.balance).toEqual(Utils.BigNumber.make(senderBalance));
        });
    });
});
