import "jest-extended";

import _ from "lodash";

import { buildSenderWallet, initApp } from "../__support__/app";
import { CryptoSuite, Interfaces as BlockInterfaces } from "../../../../packages/core-crypto";
import { Application, Contracts } from "../../../../packages/core-kernel";
import { Identifiers } from "../../../../packages/core-kernel/src/ioc";
import { Enums, Transactions as MagistrateTransactions } from "../../../../packages/core-magistrate-crypto";
import { BridgechainResignationBuilder } from "../../../../packages/core-magistrate-crypto/src/builders";
import {
    BridgechainIsNotRegisteredByWalletError,
    BridgechainIsResignedError,
    BusinessIsResignedError,
    WalletIsNotBusinessError,
} from "../../../../packages/core-magistrate-transactions/src/errors";
import { MagistrateApplicationEvents } from "../../../../packages/core-magistrate-transactions/src/events";
import {
    BridgechainRegistrationTransactionHandler,
    BridgechainResignationTransactionHandler,
    BusinessRegistrationTransactionHandler,
} from "../../../../packages/core-magistrate-transactions/src/handlers";
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
    app.bind(Identifiers.TransactionHandler).to(BridgechainRegistrationTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(BridgechainResignationTransactionHandler);

    transactionHandlerRegistry = app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    factoryBuilder = new FactoryBuilder(crypto);
    Factories.registerWalletFactory(factoryBuilder);

    senderWallet = buildSenderWallet(app, crypto.CryptoManager);

    walletRepository.index(senderWallet);
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

        bridgechainResignationTransaction = new BridgechainResignationBuilder(
            crypto.CryptoManager,
            crypto.TransactionManager.TransactionFactory,
            crypto.TransactionManager.TransactionTools,
        )
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
            crypto.TransactionManager.TransactionTools.TransactionRegistry.deregisterTransactionType(
                MagistrateTransactions.BusinessRegistrationTransaction,
            );
            crypto.TransactionManager.TransactionTools.TransactionRegistry.deregisterTransactionType(
                MagistrateTransactions.BridgechainRegistrationTransaction,
            );
            crypto.TransactionManager.TransactionTools.TransactionRegistry.deregisterTransactionType(
                MagistrateTransactions.BridgechainResignationTransaction,
            );
        } catch {}
    });

    describe("bootstrap", () => {
        it("should resolve", async () => {
            Mocks.TransactionRepository.setTransactions([
                Mapper.mapTransactionToModel(bridgechainResignationTransaction),
            ]);
            await expect(handler.bootstrap()).toResolve();

            expect(
                senderWallet.getAttribute("business.bridgechains")[bridgechainRegistrationAsset.genesisHash].resigned,
            ).toBeTrue();
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
            await expect(
                handler.throwIfCannotBeApplied(bridgechainResignationTransaction, senderWallet, walletRepository),
            ).toResolve();
        });

        it("should throw if wallet is not business", async () => {
            senderWallet.forgetAttribute("business");
            await expect(
                handler.throwIfCannotBeApplied(bridgechainResignationTransaction, senderWallet, walletRepository),
            ).rejects.toThrowError(WalletIsNotBusinessError);
        });

        it("should throw if business is resigned", async () => {
            senderWallet.setAttribute("business.resigned", true);
            await expect(
                handler.throwIfCannotBeApplied(bridgechainResignationTransaction, senderWallet, walletRepository),
            ).rejects.toThrowError(BusinessIsResignedError);
        });

        it("should throw if wallet has no registered bridgechains", async () => {
            const businessAttributes = senderWallet.getAttribute("business");
            delete businessAttributes.bridgechains;

            senderWallet.setAttribute("business", businessAttributes);
            await expect(
                handler.throwIfCannotBeApplied(bridgechainResignationTransaction, senderWallet, walletRepository),
            ).rejects.toThrowError(BridgechainIsNotRegisteredByWalletError);
        });

        it("should throw if bridgechain is not registered", async () => {
            bridgechainResignationTransaction = new BridgechainResignationBuilder(
                crypto.CryptoManager,
                crypto.TransactionManager.TransactionFactory,
                crypto.TransactionManager.TransactionTools,
            )
                .bridgechainResignationAsset("6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b")
                .nonce("1")
                .sign(passphrases[0])
                .build();

            await expect(
                handler.throwIfCannotBeApplied(bridgechainResignationTransaction, senderWallet, walletRepository),
            ).rejects.toThrowError(BridgechainIsNotRegisteredByWalletError);
        });

        it("should throw if bridgechain is resigned", async () => {
            const businessAttributes = senderWallet.getAttribute("business");
            businessAttributes.bridgechains[bridgechainRegistrationAsset.genesisHash].resigned = true;

            senderWallet.setAttribute("business", businessAttributes);
            await expect(
                handler.throwIfCannotBeApplied(bridgechainResignationTransaction, senderWallet, walletRepository),
            ).rejects.toThrowError(BridgechainIsResignedError);
        });

        it("should throw if transaction asset is missing", async () => {
            delete bridgechainResignationTransaction.data.asset;

            await expect(
                handler.throwIfCannotBeApplied(bridgechainResignationTransaction, senderWallet, walletRepository),
            ).rejects.toThrowError();
        });

        it("should throw if wallet has insufficient balance", async () => {
            senderWallet.balance = crypto.CryptoManager.LibraryManager.Libraries.BigNumber.ZERO;
            const bridgechainResignationTransaction = new BridgechainResignationBuilder(
                crypto.CryptoManager,
                crypto.TransactionManager.TransactionFactory,
                crypto.TransactionManager.TransactionTools,
            )
                .bridgechainResignationAsset(bridgechainRegistrationAsset.genesisHash)
                .amount("10")
                .nonce("1")
                .sign(passphrases[0])
                .build();

            await expect(
                handler.throwIfCannotBeApplied(bridgechainResignationTransaction, senderWallet, walletRepository),
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
            const senderBalance = senderWallet.balance;

            await handler.apply(bridgechainResignationTransaction, walletRepository);

            expect(
                senderWallet.getAttribute("business.bridgechains")[bridgechainRegistrationAsset.genesisHash].resigned,
            ).toBeTrue();

            expect(senderWallet.balance).toEqual(
                crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make(senderBalance)
                    .minus(bridgechainResignationTransaction.data.amount)
                    .minus(bridgechainResignationTransaction.data.fee),
            );
        });

        it("should throw if transaction asset is missing", async () => {
            delete bridgechainResignationTransaction.data.asset;

            await expect(handler.apply(bridgechainResignationTransaction, walletRepository)).rejects.toThrowError();
        });
    });

    describe("revert", () => {
        it("should be ok", async () => {
            const senderBalance = senderWallet.balance;

            await handler.apply(bridgechainResignationTransaction, walletRepository);

            expect(
                senderWallet.getAttribute("business.bridgechains")[bridgechainRegistrationAsset.genesisHash].resigned,
            ).toBeTrue();

            await handler.revert(bridgechainResignationTransaction, walletRepository);

            expect(
                senderWallet.getAttribute("business.bridgechains")[bridgechainRegistrationAsset.genesisHash].resigned,
            ).toBeFalse();

            expect(senderWallet.balance).toEqual(
                crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make(senderBalance),
            );
        });

        it("should throw if transaction asset is missing", async () => {
            await handler.apply(bridgechainResignationTransaction, walletRepository);

            expect(
                senderWallet.getAttribute("business.bridgechains")[bridgechainRegistrationAsset.genesisHash].resigned,
            ).toBeTrue();

            delete bridgechainResignationTransaction.data.asset;

            await expect(handler.revert(bridgechainResignationTransaction, walletRepository)).rejects.toThrowError();
        });
    });
});
