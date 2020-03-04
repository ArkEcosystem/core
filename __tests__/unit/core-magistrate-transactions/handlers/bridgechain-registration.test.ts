import "jest-extended";

import { Application, Contracts } from "@arkecosystem/core-kernel";
import { Identifiers } from "@arkecosystem/core-kernel/src/ioc";
import { Enums, Transactions as MagistrateTransactions } from "@arkecosystem/core-magistrate-crypto";
import { BridgechainRegistrationBuilder } from "@arkecosystem/core-magistrate-crypto/src/builders";
import {
    IBridgechainRegistrationAsset,
    IBusinessRegistrationAsset,
} from "@arkecosystem/core-magistrate-crypto/src/interfaces";
import {
    BridgechainAlreadyRegisteredError,
    BusinessIsResignedError,
    GenesisHashAlreadyRegisteredError,
    PortKeyMustBeValidPackageNameError,
    WalletIsNotBusinessError,
} from "@arkecosystem/core-magistrate-transactions/src/errors";
import { MagistrateApplicationEvents } from "@arkecosystem/core-magistrate-transactions/src/events";
import {
    BridgechainRegistrationTransactionHandler,
    BusinessRegistrationTransactionHandler,
} from "@arkecosystem/core-magistrate-transactions/src/handlers";
import { Wallets } from "@arkecosystem/core-state";
import { StateStore } from "@arkecosystem/core-state/src/stores/state";
import { Generators } from "@arkecosystem/core-test-framework/src";
import { Factories, FactoryBuilder } from "@arkecosystem/core-test-framework/src/factories";
import passphrases from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
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
    app.bind(Identifiers.TransactionHandler).to(BridgechainRegistrationTransactionHandler);

    transactionHandlerRegistry = app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    factoryBuilder = new FactoryBuilder();
    Factories.registerWalletFactory(factoryBuilder);

    senderWallet = buildSenderWallet(app);

    walletRepository.index(senderWallet);
});

describe("BusinessRegistration", () => {
    let bridgechainRegistrationTransaction: Interfaces.ITransaction;
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

        businessRegistrationAsset = {
            name: "DummyBusiness",
            website: "https://www.dummy.example",
            vat: "EX1234567890",
            repository: "https://www.dummy.example/repo",
        };
        bridgechainRegistrationAsset = {
            name: "arkecosystem1",
            seedNodes: [
                "74.125.224.71",
                "74.125.224.72",
                "64.233.173.193",
                "2001:4860:4860::8888",
                "2001:4860:4860::8844",
            ],
            genesisHash: "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935",
            bridgechainRepository: "http://www.repository.com/myorg/myrepo",
            bridgechainAssetRepository: "http://www.repository.com/myorg/myassetrepo",
            ports: { "@arkecosystem/core-api": 12345 },
        };

        bridgechainRegistrationTransaction = new BridgechainRegistrationBuilder()
            .bridgechainRegistrationAsset(bridgechainRegistrationAsset)
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
                MagistrateTransactions.BridgechainRegistrationTransaction,
            );
        } catch {}
    });

    describe("bootstrap", () => {
        afterEach(() => {
            setMockBlock(null);
        });

        it("should resolve", async () => {
            setMockTransaction(bridgechainRegistrationTransaction);
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
        let pubKeyHash: number;

        beforeEach(() => {
            pubKeyHash = configManager.get("network.pubKeyHash");
        });

        afterEach(() => {
            configManager.set("exceptions.transactions", []);
            configManager.set("network.pubKeyHash", pubKeyHash);
            // Trigger whitelistedBlockAndTransactionIds recalculation
            Utils.isException(bridgechainRegistrationTransaction.data.id);
        });

        it("should not throw", async () => {
            await expect(
                handler.throwIfCannotBeApplied(bridgechainRegistrationTransaction, senderWallet, walletRepository),
            ).toResolve();
        });

        it("should not throw without custom wallet repository", async () => {
            await expect(handler.throwIfCannotBeApplied(bridgechainRegistrationTransaction, senderWallet)).toResolve();
        });

        it("should not throw defined as exception", async () => {
            configManager.set("network.pubKeyHash", 99);
            configManager.set("exceptions.transactions", [bridgechainRegistrationTransaction.data.id]);

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
            senderWallet.balance = Utils.BigNumber.ZERO;
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
                Utils.BigNumber.make(senderBalance)
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
                Utils.BigNumber.make(senderBalance)
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

            expect(senderWallet.balance).toEqual(Utils.BigNumber.make(senderBalance));
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

            expect(senderWallet.balance).toEqual(Utils.BigNumber.make(senderBalance));
        });
    });
});
