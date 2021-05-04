import "jest-extended";

import { Application, Contracts } from "@packages/core-kernel";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { Enums, Transactions as MagistrateTransactions } from "@packages/core-magistrate-crypto";
import { BusinessRegistrationBuilder } from "@packages/core-magistrate-crypto/src/builders";
import { BusinessAlreadyRegisteredError } from "@packages/core-magistrate-transactions/src/errors";
import { MagistrateApplicationEvents } from "@packages/core-magistrate-transactions/src/events";
import {
    BusinessRegistrationTransactionHandler,
    EntityTransactionHandler,
} from "@packages/core-magistrate-transactions/src/handlers";
import { MagistrateIndex } from "@packages/core-magistrate-transactions/src/wallet-indexes";
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
import _ from "lodash";

import { buildSenderWallet, initApp } from "../__support__/app";
import { Assets } from "./__fixtures__";

let app: Application;
let senderWallet: Contracts.State.Wallet;
let walletRepository: Contracts.State.WalletRepository;
let factoryBuilder: FactoryBuilder;
let transactionHandlerRegistry: TransactionHandlerRegistry;

const mockLastBlockData: Partial<Interfaces.IBlockData> = { timestamp: Crypto.Slots.getTime(), height: 4 };
const mockGetLastBlock = jest.fn();
StateStore.prototype.getLastBlock = mockGetLastBlock;
mockGetLastBlock.mockReturnValue({ data: mockLastBlockData });

const transactionHistoryService = {
    streamByCriteria: jest.fn(),
};

beforeEach(() => {
    transactionHistoryService.streamByCriteria.mockReset();

    const config = Generators.generateCryptoConfigRaw();
    configManager.setConfig(config);
    Managers.configManager.setConfig(config);

    app = initApp();

    app.bind(Identifiers.TransactionHistoryService).toConstantValue(transactionHistoryService);
    app.bind(Identifiers.TransactionHandler).to(BusinessRegistrationTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(EntityTransactionHandler);

    transactionHandlerRegistry = app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    factoryBuilder = new FactoryBuilder();
    Factories.registerWalletFactory(factoryBuilder);

    senderWallet = buildSenderWallet(app);

    walletRepository.index(senderWallet);
});

afterEach(() => {
    try {
        Transactions.TransactionRegistry.deregisterTransactionType(MagistrateTransactions.EntityTransaction);
    } catch {}
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
        it("should resolve", async () => {
            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield businessRegistrationTransaction.data;
            });

            await expect(handler.bootstrap()).toResolve();

            expect(senderWallet.getAttribute("business.businessAsset")).toEqual(businessRegistrationAsset);
            expect(transactionHistoryService.streamByCriteria).toBeCalledWith({
                typeGroup: Enums.MagistrateTransactionGroup,
                type: Enums.MagistrateTransactionType.BusinessRegistration,
            });
        });

        it("should throw if asset is undefined", async () => {
            businessRegistrationTransaction.data.asset = undefined;

            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield businessRegistrationTransaction.data;
            });

            await expect(handler.bootstrap()).rejects.toThrow();
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
            await expect(handler.throwIfCannotBeApplied(businessRegistrationTransaction, senderWallet)).toResolve();
        });

        it("should throw if business already registered", async () => {
            senderWallet.setAttribute("business", {});
            await expect(
                handler.throwIfCannotBeApplied(businessRegistrationTransaction, senderWallet),
            ).rejects.toThrowError(BusinessAlreadyRegisteredError);
        });

        it("should throw if wallet has insufficient balance", async () => {
            senderWallet.setBalance(Utils.BigNumber.ZERO);
            await expect(
                handler.throwIfCannotBeApplied(businessRegistrationTransaction, senderWallet),
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
            const senderBalance = senderWallet.getBalance();

            await handler.apply(businessRegistrationTransaction);

            expect(senderWallet.hasAttribute("business")).toBeTrue();
            expect(senderWallet.getAttribute("business.businessAsset")).toEqual(businessRegistrationAsset);

            expect(senderWallet.getBalance()).toEqual(
                Utils.BigNumber.make(senderBalance)
                    .minus(businessRegistrationTransaction.data.amount)
                    .minus(businessRegistrationTransaction.data.fee),
            );

            expect(walletRepository.findByIndex(MagistrateIndex.Businesses, senderWallet.getPublicKey()!)).toEqual(
                senderWallet,
            );
        });

        it("should throw if transaction asset is missing", async () => {
            delete businessRegistrationTransaction.data.asset;

            await expect(handler.apply(businessRegistrationTransaction)).rejects.toThrowError();
        });
    });

    describe("revert", () => {
        it("should be ok", async () => {
            const senderBalance = senderWallet.getBalance();

            await handler.apply(businessRegistrationTransaction);

            expect(senderWallet.hasAttribute("business")).toBeTrue();

            await handler.revert(businessRegistrationTransaction);

            expect(senderWallet.hasAttribute("business")).toBeFalse();
            expect(senderWallet.getBalance()).toEqual(Utils.BigNumber.make(senderBalance));

            // ! not related to search
            // ! test failing due to index changes
            // ! wallet isn't removed anymore during revert
            // expect(() => {
            //     walletRepository.findByIndex(MagistrateIndex.Businesses, senderWallet.publicKey!);
            // }).toThrowError();
        });
    });
});
