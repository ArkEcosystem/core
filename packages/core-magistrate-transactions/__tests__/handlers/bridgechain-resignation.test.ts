import "jest-extended";

import { Application, Contracts } from "@packages/core-kernel";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { Enums, Transactions as MagistrateTransactions } from "@packages/core-magistrate-crypto";
import { BridgechainResignationBuilder } from "@packages/core-magistrate-crypto/src/builders";
import {
    BridgechainIsNotRegisteredByWalletError,
    BridgechainIsResignedError,
    BusinessIsResignedError,
    WalletIsNotBusinessError,
} from "@packages/core-magistrate-transactions/src/errors";
import { MagistrateApplicationEvents } from "@packages/core-magistrate-transactions/src/events";
import {
    BridgechainRegistrationTransactionHandler,
    BridgechainResignationTransactionHandler,
    BusinessRegistrationTransactionHandler,
    EntityTransactionHandler,
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
    app.bind(Identifiers.TransactionHandler).to(BridgechainRegistrationTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(BridgechainResignationTransactionHandler);
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
    let bridgechainResignationTransaction: Interfaces.ITransaction;
    let handler: TransactionHandler;
    const businessRegistrationAsset = _.cloneDeep(Assets.businessRegistrationAsset);
    const bridgechainRegistrationAsset = _.cloneDeep(Assets.bridgechainRegistrationAsset);

    beforeEach(async () => {
        handler = transactionHandlerRegistry.getRegisteredHandlerByType(
            Transactions.InternalTransactionType.from(
                Enums.MagistrateTransactionType.BridgechainResignation,
                Enums.MagistrateTransactionGroup,
            ),
            2,
        );

        bridgechainResignationTransaction = new BridgechainResignationBuilder()
            .bridgechainResignationAsset(bridgechainRegistrationAsset.genesisHash)
            .nonce("1")
            .sign(passphrases[0])
            .build();

        senderWallet.setAttribute("business.businessAsset", businessRegistrationAsset);

        const businessAttributes = senderWallet.getAttribute("business");

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
        it("should resolve", async () => {
            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield bridgechainResignationTransaction.data;
            });

            await expect(handler.bootstrap()).toResolve();

            expect(
                senderWallet.getAttribute("business.bridgechains")[bridgechainRegistrationAsset.genesisHash].resigned,
            ).toBeTrue();

            expect(transactionHistoryService.streamByCriteria).toBeCalledWith({
                typeGroup: Enums.MagistrateTransactionGroup,
                type: Enums.MagistrateTransactionType.BridgechainResignation,
            });
        });

        it("should throw if asset is undefined", async () => {
            bridgechainResignationTransaction.data.asset = undefined;

            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield bridgechainResignationTransaction.data;
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

            handler.emitEvents(bridgechainResignationTransaction, emitter);

            expect(spy).toHaveBeenCalledWith(MagistrateApplicationEvents.BridgechainResigned, expect.anything());
        });
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotBeApplied(bridgechainResignationTransaction, senderWallet)).toResolve();
        });

        it("should throw if wallet is not business", async () => {
            senderWallet.forgetAttribute("business");
            await expect(
                handler.throwIfCannotBeApplied(bridgechainResignationTransaction, senderWallet),
            ).rejects.toThrowError(WalletIsNotBusinessError);
        });

        it("should throw if business is resigned", async () => {
            senderWallet.setAttribute("business.resigned", true);
            await expect(
                handler.throwIfCannotBeApplied(bridgechainResignationTransaction, senderWallet),
            ).rejects.toThrowError(BusinessIsResignedError);
        });

        it("should throw if wallet has no registered bridgechains", async () => {
            const businessAttributes = senderWallet.getAttribute("business");
            delete businessAttributes.bridgechains;

            senderWallet.setAttribute("business", businessAttributes);
            await expect(
                handler.throwIfCannotBeApplied(bridgechainResignationTransaction, senderWallet),
            ).rejects.toThrowError(BridgechainIsNotRegisteredByWalletError);
        });

        it("should throw if bridgechain is not registered", async () => {
            bridgechainResignationTransaction = new BridgechainResignationBuilder()
                .bridgechainResignationAsset("6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b")
                .nonce("1")
                .sign(passphrases[0])
                .build();

            await expect(
                handler.throwIfCannotBeApplied(bridgechainResignationTransaction, senderWallet),
            ).rejects.toThrowError(BridgechainIsNotRegisteredByWalletError);
        });

        it("should throw if bridgechain is resigned", async () => {
            const businessAttributes = senderWallet.getAttribute("business");
            businessAttributes.bridgechains[bridgechainRegistrationAsset.genesisHash].resigned = true;

            senderWallet.setAttribute("business", businessAttributes);
            await expect(
                handler.throwIfCannotBeApplied(bridgechainResignationTransaction, senderWallet),
            ).rejects.toThrowError(BridgechainIsResignedError);
        });

        it("should throw if transaction asset is missing", async () => {
            delete bridgechainResignationTransaction.data.asset;

            await expect(
                handler.throwIfCannotBeApplied(bridgechainResignationTransaction, senderWallet),
            ).rejects.toThrowError();
        });

        it("should throw if wallet has insufficient balance", async () => {
            senderWallet.setBalance(Utils.BigNumber.ZERO);
            await expect(
                handler.throwIfCannotBeApplied(bridgechainResignationTransaction, senderWallet),
            ).rejects.toThrowError(InsufficientBalanceError);
        });
    });

    describe("throwIfCannotEnterPool", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotEnterPool(bridgechainResignationTransaction)).toResolve();
        });

        it("should throw if transaction by sender already in pool", async () => {
            await app
                .get<Mempool>(Identifiers.TransactionPoolMempool)
                .addTransaction(bridgechainResignationTransaction);

            await expect(handler.throwIfCannotEnterPool(bridgechainResignationTransaction)).rejects.toThrow(
                Contracts.TransactionPool.PoolError,
            );
        });
    });

    describe("apply", () => {
        it("should be ok", async () => {
            const senderBalance = senderWallet.getBalance();

            await handler.apply(bridgechainResignationTransaction);

            expect(
                senderWallet.getAttribute("business.bridgechains")[bridgechainRegistrationAsset.genesisHash].resigned,
            ).toBeTrue();

            expect(senderWallet.getBalance()).toEqual(
                Utils.BigNumber.make(senderBalance)
                    .minus(bridgechainResignationTransaction.data.amount)
                    .minus(bridgechainResignationTransaction.data.fee),
            );
        });

        it("should throw if transaction asset is missing", async () => {
            delete bridgechainResignationTransaction.data.asset;

            await expect(handler.apply(bridgechainResignationTransaction)).rejects.toThrowError();
        });
    });

    describe("revert", () => {
        it("should be ok", async () => {
            const senderBalance = senderWallet.getBalance();

            await handler.apply(bridgechainResignationTransaction);

            expect(
                senderWallet.getAttribute("business.bridgechains")[bridgechainRegistrationAsset.genesisHash].resigned,
            ).toBeTrue();

            await handler.revert(bridgechainResignationTransaction);

            expect(
                senderWallet.getAttribute("business.bridgechains")[bridgechainRegistrationAsset.genesisHash].resigned,
            ).toBeFalse();

            expect(senderWallet.getBalance()).toEqual(Utils.BigNumber.make(senderBalance));
        });

        it("should throw if transaction asset is missing", async () => {
            await handler.apply(bridgechainResignationTransaction);

            expect(
                senderWallet.getAttribute("business.bridgechains")[bridgechainRegistrationAsset.genesisHash].resigned,
            ).toBeTrue();

            delete bridgechainResignationTransaction.data.asset;

            await expect(handler.revert(bridgechainResignationTransaction)).rejects.toThrowError();
        });
    });
});
