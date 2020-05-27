import "jest-extended";

import _ from "lodash";

import { buildSenderWallet, initApp } from "../__support__/app";
import { CryptoSuite, Interfaces } from "../../../../packages/core-crypto";
import { Application, Contracts } from "../../../../packages/core-kernel";
import { Identifiers } from "../../../../packages/core-kernel/src/ioc";
import { Enums, Transactions as MagistrateTransactions } from "../../../../packages/core-magistrate-crypto";
import { BridgechainRegistrationBuilder } from "../../../../packages/core-magistrate-crypto/src/builders";
import {
    IBridgechainRegistrationAsset,
    IBusinessRegistrationAsset,
} from "../../../../packages/core-magistrate-crypto/src/interfaces";
import {
    BridgechainAlreadyRegisteredError,
    BusinessIsResignedError,
    GenesisHashAlreadyRegisteredError,
    PortKeyMustBeValidPackageNameError,
    WalletIsNotBusinessError,
} from "../../../../packages/core-magistrate-transactions/src/errors";
import { MagistrateApplicationEvents } from "../../../../packages/core-magistrate-transactions/src/events";
import {
    BridgechainRegistrationTransactionHandler,
    BusinessRegistrationTransactionHandler,
} from "../../../../packages/core-magistrate-transactions/src/handlers";
import { Wallets } from "../../../../packages/core-state";
import { StateStore } from "../../../../packages/core-state/src/stores/state";
import { Mapper, Mocks } from "../../../../packages/core-test-framework/src";
import { Generators } from "../../../../packages/core-test-framework/src";
import { Factories, FactoryBuilder } from "../../../../packages/core-test-framework/src/factories";
import passphrases from "../../../../packages/core-test-framework/src/internal/passphrases.json";
import { InsufficientBalanceError } from "../../../../packages/core-transactions/dist/errors";
import { TransactionHandler } from "../../../../packages/core-transactions/src/handlers";
import { TransactionHandlerRegistry } from "../../../../packages/core-transactions/src/handlers/handler-registry";
import { Interfaces as TransactionInterfaces, Transactions } from "../../../../packages/crypto";
import { Assets } from "./__fixtures__";

let crypto: CryptoSuite.CryptoSuite;
let app: Application;
let senderWallet: Contracts.State.Wallet;
let walletRepository: Contracts.State.WalletRepository;
let factoryBuilder: FactoryBuilder;
let transactionHandlerRegistry: TransactionHandlerRegistry;

let mockLastBlockData: Partial<Interfaces.IBlockData>;
let mockGetLastBlock;

beforeEach(() => {
    const config = Generators.generateCryptoConfigRaw();
    crypto = new CryptoSuite.CryptoSuite(config);
    crypto.CryptoManager.HeightTracker.setHeight(2);
    Mocks.TransactionRepository.setTransaction(null);
    Mocks.TransactionRepository.setTransactions([]);

    app = initApp(crypto);

    mockLastBlockData = { timestamp: crypto.CryptoManager.LibraryManager.Crypto.Slots.getTime(), height: 4 };
    mockGetLastBlock = jest.fn();
    StateStore.prototype.getLastBlock = mockGetLastBlock;
    mockGetLastBlock.mockReturnValue({ data: mockLastBlockData });

    app.bind(Identifiers.TransactionHandler).to(BusinessRegistrationTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(BridgechainRegistrationTransactionHandler);

    transactionHandlerRegistry = app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    factoryBuilder = new FactoryBuilder();
    Factories.registerWalletFactory(factoryBuilder);

    senderWallet = buildSenderWallet(app, crypto.CryptoManager);

    walletRepository.index(senderWallet);
});

describe("BusinessRegistration", () => {
    let bridgechainRegistrationTransaction: TransactionInterfaces.ITransaction;
    let handler: TransactionHandler;
    let businessRegistrationAsset: IBusinessRegistrationAsset;
    let bridgechainRegistrationAsset: IBridgechainRegistrationAsset;

    beforeEach(async () => {
        handler = transactionHandlerRegistry.getRegisteredHandlerByType(
            Transactions.InternalTransactionType.from(
                Enums.MagistrateTransactionType.BridgechainRegistration,
                Enums.MagistrateTransactionGroup,
            ),
            2,
        );

        businessRegistrationAsset = _.cloneDeep(Assets.businessRegistrationAsset);
        bridgechainRegistrationAsset = _.cloneDeep(Assets.bridgechainRegistrationAsset);

        bridgechainRegistrationTransaction = new BridgechainRegistrationBuilder(
            crypto.CryptoManager,
            crypto.TransactionManager.TransactionFactory,
            crypto.TransactionManager.TransactionTools,
        )
            .bridgechainRegistrationAsset(bridgechainRegistrationAsset)
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
                MagistrateTransactions.BridgechainRegistrationTransaction,
            );
        } catch {}
    });

    describe("bootstrap", () => {
        it("should resolve", async () => {
            Mocks.TransactionRepository.setTransactions([
                Mapper.mapTransactionToModel(bridgechainRegistrationTransaction, crypto.CryptoManager as any),
            ]);
            await expect(handler.bootstrap()).toResolve();

            expect(
                senderWallet.getAttribute("business.bridgechains")[bridgechainRegistrationAsset.genesisHash]
                    .bridgechainAsset,
            ).toEqual(bridgechainRegistrationAsset);
        });
    });

    describe("emitEvents", () => {
        it("should dispatch", async () => {
            const emitter: Contracts.Kernel.EventDispatcher = app.get<Contracts.Kernel.EventDispatcher>(
                Identifiers.EventDispatcherService,
            );

            const spy = jest.spyOn(emitter, "dispatch");

            handler.emitEvents(bridgechainRegistrationTransaction, emitter);

            expect(spy).toHaveBeenCalledWith(MagistrateApplicationEvents.BridgechainRegistered, expect.anything());
        });
    });

    describe("throwIfCannotBeApplied", () => {
        // let pubKeyHash: number;

        // beforeEach(() => {
        //     pubKeyHash = configManager.get("network.pubKeyHash");
        // });

        // afterEach(() => {
        //     configManager.set("exceptions.transactions", []);
        //     configManager.set("network.pubKeyHash", pubKeyHash);
        //     // Trigger whitelistedBlockAndTransactionIds recalculation
        //     crypto.CryptoManager.LibraryManager.Libraries.isException(bridgechainRegistrationTransaction.data.id);
        // });

        it("should not throw", async () => {
            await expect(
                handler.throwIfCannotBeApplied(bridgechainRegistrationTransaction, senderWallet, walletRepository),
            ).toResolve();
        });

        it("should not throw without custom wallet repository", async () => {
            await expect(handler.throwIfCannotBeApplied(bridgechainRegistrationTransaction, senderWallet)).toResolve();
        });

        it("should not throw defined as exception", async () => {
            // configManager.set("network.pubKeyHash", 99);
            // configManager.set("exceptions.transactions", [bridgechainRegistrationTransaction.data.id]);

            await expect(
                handler.throwIfCannotBeApplied(bridgechainRegistrationTransaction, senderWallet, walletRepository),
            ).toResolve();
        });

        it("should throw if wallet is not business", async () => {
            senderWallet.forgetAttribute("business");
            await expect(
                handler.throwIfCannotBeApplied(bridgechainRegistrationTransaction, senderWallet, walletRepository),
            ).rejects.toThrowError(WalletIsNotBusinessError);
        });

        it("should throw if business is resigned", async () => {
            senderWallet.setAttribute("business.resigned", true);
            await expect(
                handler.throwIfCannotBeApplied(bridgechainRegistrationTransaction, senderWallet, walletRepository),
            ).rejects.toThrowError(BusinessIsResignedError);
        });

        it("should throw if bridgechain is already registered", async () => {
            bridgechainRegistrationAsset.genesisHash =
                "6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b";

            const businessAttributes = {
                bridgechains: {},
            };

            businessAttributes.bridgechains[bridgechainRegistrationAsset.genesisHash] = {
                bridgechainAsset: bridgechainRegistrationAsset,
            };

            senderWallet.setAttribute("business", businessAttributes);

            walletRepository.index(senderWallet);

            await expect(
                handler.throwIfCannotBeApplied(bridgechainRegistrationTransaction, senderWallet, walletRepository),
            ).rejects.toThrowError(BridgechainAlreadyRegisteredError);
        });

        it("should throw if genesis hash is already registered", async () => {
            const businessAttributes = {
                bridgechains: {},
            };

            businessAttributes.bridgechains[bridgechainRegistrationAsset.genesisHash] = {
                bridgechainAsset: bridgechainRegistrationAsset,
            };

            senderWallet.setAttribute("business", businessAttributes);

            walletRepository.index(senderWallet);

            await expect(
                handler.throwIfCannotBeApplied(bridgechainRegistrationTransaction, senderWallet, walletRepository),
            ).rejects.toThrowError(GenesisHashAlreadyRegisteredError);
        });

        it("should throw if wallet is port name is invalid", async () => {
            bridgechainRegistrationTransaction.data.asset!.bridgechainRegistration.ports = {
                "@arkecosystem/INVALID": 55555,
            };

            await expect(
                handler.throwIfCannotBeApplied(bridgechainRegistrationTransaction, senderWallet, walletRepository),
            ).rejects.toThrowError(PortKeyMustBeValidPackageNameError);
        });

        it("should throw if wallet has insufficient balance", async () => {
            senderWallet.balance = crypto.CryptoManager.LibraryManager.Libraries.BigNumber.ZERO;
            await expect(
                handler.throwIfCannotBeApplied(bridgechainRegistrationTransaction, senderWallet, walletRepository),
            ).rejects.toThrowError(InsufficientBalanceError);
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

            expect(
                senderWallet.getAttribute("business.bridgechains")[bridgechainRegistrationAsset.genesisHash]
                    .bridgechainAsset,
            ).toEqual(bridgechainRegistrationAsset);

            expect(senderWallet.balance).toEqual(
                crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make(senderBalance)
                    .minus(bridgechainRegistrationTransaction.data.amount)
                    .minus(bridgechainRegistrationTransaction.data.fee),
            );
        });

        it("should be ok without custom wallet repository", async () => {
            const senderBalance = senderWallet.balance;

            await handler.apply(bridgechainRegistrationTransaction);

            expect(
                senderWallet.getAttribute("business.bridgechains")[bridgechainRegistrationAsset.genesisHash]
                    .bridgechainAsset,
            ).toEqual(bridgechainRegistrationAsset);

            expect(senderWallet.balance).toEqual(
                crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make(senderBalance)
                    .minus(bridgechainRegistrationTransaction.data.amount)
                    .minus(bridgechainRegistrationTransaction.data.fee),
            );
        });

        it("should throw if transaction asset is missing", async () => {
            delete bridgechainRegistrationTransaction.data.asset;

            await expect(handler.apply(bridgechainRegistrationTransaction)).rejects.toThrowError();
        });
    });

    describe("revert", () => {
        it("should be ok", async () => {
            const senderBalance = senderWallet.balance;

            await handler.apply(bridgechainRegistrationTransaction, walletRepository);

            expect(
                senderWallet.getAttribute("business.bridgechains")[bridgechainRegistrationAsset.genesisHash]
                    .bridgechainAsset,
            ).toEqual(bridgechainRegistrationAsset);

            await handler.revert(bridgechainRegistrationTransaction, walletRepository);

            expect(
                senderWallet.hasAttribute("business.bridgechains")[bridgechainRegistrationAsset.genesisHash],
            ).toBeUndefined();

            expect(senderWallet.balance).toEqual(
                crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make(senderBalance),
            );
        });

        it("should be ok without custom wallet repository", async () => {
            const senderBalance = senderWallet.balance;

            await handler.apply(bridgechainRegistrationTransaction);

            expect(
                senderWallet.getAttribute("business.bridgechains")[bridgechainRegistrationAsset.genesisHash]
                    .bridgechainAsset,
            ).toEqual(bridgechainRegistrationAsset);

            await handler.revert(bridgechainRegistrationTransaction);

            expect(
                senderWallet.hasAttribute("business.bridgechains")[bridgechainRegistrationAsset.genesisHash],
            ).toBeUndefined();

            expect(senderWallet.balance).toEqual(
                crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make(senderBalance),
            );
        });
    });
});
