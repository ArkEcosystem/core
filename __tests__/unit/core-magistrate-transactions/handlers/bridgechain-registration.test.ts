import "jest-extended";

import { Application, Contracts } from "@packages/core-kernel";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { Enums, Transactions as MagistrateTransactions } from "@packages/core-magistrate-crypto";
import { BridgechainRegistrationBuilder } from "@packages/core-magistrate-crypto/src/builders";
import {
    IBridgechainRegistrationAsset,
    IBusinessRegistrationAsset,
} from "@packages/core-magistrate-crypto/src/interfaces";
import {
    BridgechainAlreadyRegisteredError,
    BusinessIsResignedError,
    GenesisHashAlreadyRegisteredError,
    PortKeyMustBeValidPackageNameError,
    WalletIsNotBusinessError,
} from "@packages/core-magistrate-transactions/src/errors";
import { MagistrateApplicationEvents } from "@packages/core-magistrate-transactions/src/events";
import {
    BridgechainRegistrationTransactionHandler,
    BusinessRegistrationTransactionHandler,
    EntityTransactionHandler,
} from "@packages/core-magistrate-transactions/src/handlers";
import { Wallets } from "@packages/core-state";
import { StateStore } from "@packages/core-state/src/stores/state";
import { Generators } from "@packages/core-test-framework/src";
import { Factories, FactoryBuilder } from "@packages/core-test-framework/src/factories";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
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

        businessRegistrationAsset = _.cloneDeep(Assets.businessRegistrationAsset);
        bridgechainRegistrationAsset = _.cloneDeep(Assets.bridgechainRegistrationAsset);

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
        it("should resolve", async () => {
            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield bridgechainRegistrationTransaction.data;
            });

            await expect(handler.bootstrap()).toResolve();

            expect(
                senderWallet.getAttribute("business.bridgechains")[bridgechainRegistrationAsset.genesisHash]
                    .bridgechainAsset,
            ).toEqual(bridgechainRegistrationAsset);

            expect(transactionHistoryService.streamByCriteria).toBeCalledWith({
                typeGroup: Enums.MagistrateTransactionGroup,
                type: Enums.MagistrateTransactionType.BridgechainRegistration,
            });
        });

        it("should resolve if wallet have empty bridgechains attribute", async () => {
            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield bridgechainRegistrationTransaction.data;
            });

            senderWallet.setAttribute("business.bridgechains", {});

            await expect(handler.bootstrap()).toResolve();
        });

        it("should throw if asset is undefined", async () => {
            bridgechainRegistrationTransaction.data.asset = undefined;

            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield bridgechainRegistrationTransaction.data;
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
            Utils.isException(bridgechainRegistrationTransaction.data);
        });

        it("should not throw", async () => {
            await expect(handler.throwIfCannotBeApplied(bridgechainRegistrationTransaction, senderWallet)).toResolve();
        });

        it("should not throw without custom wallet repository", async () => {
            await expect(handler.throwIfCannotBeApplied(bridgechainRegistrationTransaction, senderWallet)).toResolve();
        });

        it("should not throw defined as exception", async () => {
            configManager.set("network.pubKeyHash", 99);
            configManager.set("exceptions.transactions", [bridgechainRegistrationTransaction.data.id]);

            await expect(handler.throwIfCannotBeApplied(bridgechainRegistrationTransaction, senderWallet)).toResolve();
        });

        it("should not throw if genesis hash is not registered", async () => {
            const businessAttributes = {
                bridgechains: {},
            };

            businessAttributes.bridgechains["a_different_genesis_hash"] = {
                bridgechainAsset: { ...bridgechainRegistrationAsset, name: "adifferentname" },
            };

            senderWallet.setAttribute("business", businessAttributes);

            walletRepository.index(senderWallet);

            await expect(handler.throwIfCannotBeApplied(bridgechainRegistrationTransaction, senderWallet)).toResolve();
        });

        it("should throw if wallet is not business", async () => {
            senderWallet.forgetAttribute("business");
            await expect(
                handler.throwIfCannotBeApplied(bridgechainRegistrationTransaction, senderWallet),
            ).rejects.toThrowError(WalletIsNotBusinessError);
        });

        it("should throw if business is resigned", async () => {
            senderWallet.setAttribute("business.resigned", true);
            await expect(
                handler.throwIfCannotBeApplied(bridgechainRegistrationTransaction, senderWallet),
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
                handler.throwIfCannotBeApplied(bridgechainRegistrationTransaction, senderWallet),
            ).rejects.toThrowError(BridgechainAlreadyRegisteredError);
        });

        it("should throw if genesis hash is already registered", async () => {
            const businessAttributes = {
                bridgechains: {},
            };

            businessAttributes.bridgechains[bridgechainRegistrationAsset.genesisHash] = {
                bridgechainAsset: { ...bridgechainRegistrationAsset, name: "adifferentname" },
            };

            senderWallet.setAttribute("business", businessAttributes);

            walletRepository.index(senderWallet);

            await expect(
                handler.throwIfCannotBeApplied(bridgechainRegistrationTransaction, senderWallet),
            ).rejects.toThrowError(GenesisHashAlreadyRegisteredError);
        });

        it("should throw if wallet is port name is invalid", async () => {
            bridgechainRegistrationTransaction.data.asset!.bridgechainRegistration.ports = {
                "@arkecosystem/INVALID": 55555,
            };

            await expect(
                handler.throwIfCannotBeApplied(bridgechainRegistrationTransaction, senderWallet),
            ).rejects.toThrowError(PortKeyMustBeValidPackageNameError);
        });

        it("should throw if wallet has insufficient balance", async () => {
            senderWallet.setBalance(Utils.BigNumber.ZERO);
            await expect(
                handler.throwIfCannotBeApplied(bridgechainRegistrationTransaction, senderWallet),
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
            const senderBalance = senderWallet.getBalance();

            await handler.apply(bridgechainRegistrationTransaction);

            expect(
                senderWallet.getAttribute("business.bridgechains")[bridgechainRegistrationAsset.genesisHash]
                    .bridgechainAsset,
            ).toEqual(bridgechainRegistrationAsset);

            expect(senderWallet.getBalance()).toEqual(
                Utils.BigNumber.make(senderBalance)
                    .minus(bridgechainRegistrationTransaction.data.amount)
                    .minus(bridgechainRegistrationTransaction.data.fee),
            );
        });

        it("should be ok if empty business.bridgechains attribute already exist", async () => {
            senderWallet.setAttribute("business.bridgechains", {});

            await expect(handler.apply(bridgechainRegistrationTransaction)).toResolve();
        });

        it("should be ok without custom wallet repository", async () => {
            const senderBalance = senderWallet.getBalance();

            await handler.apply(bridgechainRegistrationTransaction);

            expect(
                senderWallet.getAttribute("business.bridgechains")[bridgechainRegistrationAsset.genesisHash]
                    .bridgechainAsset,
            ).toEqual(bridgechainRegistrationAsset);

            expect(senderWallet.getBalance()).toEqual(
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
            const senderBalance = senderWallet.getBalance();

            await handler.apply(bridgechainRegistrationTransaction);

            expect(
                senderWallet.getAttribute("business.bridgechains")[bridgechainRegistrationAsset.genesisHash]
                    .bridgechainAsset,
            ).toEqual(bridgechainRegistrationAsset);

            await handler.revert(bridgechainRegistrationTransaction);

            expect(
                senderWallet.hasAttribute("business.bridgechains")[bridgechainRegistrationAsset.genesisHash],
            ).toBeUndefined();

            expect(senderWallet.getBalance()).toEqual(Utils.BigNumber.make(senderBalance));
        });

        it("should be ok without custom wallet repository", async () => {
            const senderBalance = senderWallet.getBalance();

            await handler.apply(bridgechainRegistrationTransaction);

            expect(
                senderWallet.getAttribute("business.bridgechains")[bridgechainRegistrationAsset.genesisHash]
                    .bridgechainAsset,
            ).toEqual(bridgechainRegistrationAsset);

            await handler.revert(bridgechainRegistrationTransaction);

            expect(
                senderWallet.hasAttribute("business.bridgechains")[bridgechainRegistrationAsset.genesisHash],
            ).toBeUndefined();

            expect(senderWallet.getBalance()).toEqual(Utils.BigNumber.make(senderBalance));
        });
    });
});
