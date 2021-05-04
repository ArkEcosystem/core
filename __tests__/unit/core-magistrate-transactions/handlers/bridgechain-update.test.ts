import "jest-extended";

import { Application, Contracts } from "@packages/core-kernel";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { Enums, Transactions as MagistrateTransactions } from "@packages/core-magistrate-crypto";
import {
    BridgechainRegistrationBuilder,
    BridgechainUpdateBuilder,
} from "@packages/core-magistrate-crypto/src/builders";
import {
    IBridgechainRegistrationAsset,
    IBridgechainUpdateAsset,
    IBusinessRegistrationAsset,
} from "@packages/core-magistrate-crypto/src/interfaces";
import {
    BridgechainIsNotRegisteredByWalletError,
    BridgechainIsResignedError,
    BusinessIsNotRegisteredError,
    BusinessIsResignedError,
    PortKeyMustBeValidPackageNameError,
} from "@packages/core-magistrate-transactions/src/errors";
import { MagistrateApplicationEvents } from "@packages/core-magistrate-transactions/src/events";
import {
    BridgechainRegistrationTransactionHandler,
    BridgechainUpdateTransactionHandler,
    BusinessRegistrationTransactionHandler,
    EntityTransactionHandler,
} from "@packages/core-magistrate-transactions/src/handlers";
import { Wallets } from "@packages/core-state";
import { StateStore } from "@packages/core-state/src/stores/state";
import { Generators } from "@packages/core-test-framework/src";
import { Factories, FactoryBuilder } from "@packages/core-test-framework/src/factories";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import { Mempool } from "@packages/core-transaction-pool";
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
    findManyByCriteria: jest.fn(),
    streamByCriteria: jest.fn(),
};

beforeEach(() => {
    transactionHistoryService.findManyByCriteria.mockReset();
    transactionHistoryService.streamByCriteria.mockReset();

    const config = Generators.generateCryptoConfigRaw();
    configManager.setConfig(config);
    Managers.configManager.setConfig(config);

    app = initApp();

    app.bind(Identifiers.TransactionHistoryService).toConstantValue(transactionHistoryService);
    app.bind(Identifiers.TransactionHandler).to(BusinessRegistrationTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(BridgechainRegistrationTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(BridgechainUpdateTransactionHandler);
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
    let bridgechainUpdateTransaction: Interfaces.ITransaction;
    let handler: TransactionHandler;
    let businessRegistrationAsset: IBusinessRegistrationAsset;
    let bridgechainRegistrationAsset: IBridgechainRegistrationAsset;
    let bridgechainUpdateAsset: IBridgechainUpdateAsset;

    beforeEach(async () => {
        handler = transactionHandlerRegistry.getRegisteredHandlerByType(
            Transactions.InternalTransactionType.from(
                Enums.MagistrateTransactionType.BridgechainUpdate,
                Enums.MagistrateTransactionGroup,
            ),
            2,
        );

        businessRegistrationAsset = _.cloneDeep(Assets.businessRegistrationAsset);
        bridgechainRegistrationAsset = _.cloneDeep(Assets.bridgechainRegistrationAsset);
        bridgechainUpdateAsset = _.cloneDeep(Assets.bridgechainUpdateAsset);

        bridgechainRegistrationTransaction = new BridgechainRegistrationBuilder()
            .bridgechainRegistrationAsset(bridgechainRegistrationAsset)
            .nonce("1")
            .sign(passphrases[0])
            .build();

        const bridgechainUpdateBuilder = new BridgechainUpdateBuilder();
        bridgechainUpdateTransaction = bridgechainUpdateBuilder
            .bridgechainUpdateAsset(bridgechainUpdateAsset)
            .nonce("2")
            .sign(passphrases[0])
            .build();

        senderWallet.setAttribute("business.businessAsset", businessRegistrationAsset);
        senderWallet.setNonce(Utils.BigNumber.make("1"));

        const businessAttributes = senderWallet.getAttribute("business");

        businessAttributes.bridgechains = {};

        businessAttributes.bridgechains[bridgechainRegistrationAsset.genesisHash] = {
            bridgechainAsset: bridgechainRegistrationAsset,
        };

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
                MagistrateTransactions.BridgechainUpdateTransaction,
            );
        } catch {}
    });

    describe("bootstrap", () => {
        it("should resolve", async () => {
            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield bridgechainUpdateTransaction.data;
            });

            await expect(handler.bootstrap()).toResolve();

            const bridgechainUpdateAssetClone = Object.assign({}, bridgechainUpdateAsset);
            delete bridgechainUpdateAssetClone.bridgechainId;

            expect(
                senderWallet.getAttribute("business.bridgechains")[bridgechainRegistrationAsset.genesisHash]
                    .bridgechainAsset,
            ).toEqual({
                ...bridgechainRegistrationAsset,
                ...bridgechainUpdateAssetClone,
            });

            expect(transactionHistoryService.streamByCriteria).toBeCalledWith({
                typeGroup: Enums.MagistrateTransactionGroup,
                type: Enums.MagistrateTransactionType.BridgechainUpdate,
            });
        });

        it("should throw if asset is not defined", async () => {
            bridgechainUpdateTransaction.data.asset = undefined;

            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield bridgechainUpdateTransaction.data;
            });

            await expect(handler.bootstrap()).rejects.toThrowError();
        });

        it("should throw if asset.bridgechainUpdate asset is not defined", async () => {
            // @ts-ignore
            bridgechainUpdateTransaction.data.asset.bridgechainUpdate = undefined;

            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield bridgechainUpdateTransaction.data;
            });

            await expect(handler.bootstrap()).rejects.toThrowError();
        });
    });

    describe("emitEvents", () => {
        it("should dispatch", async () => {
            const emitter: Contracts.Kernel.EventDispatcher = app.get<Contracts.Kernel.EventDispatcher>(
                Identifiers.EventDispatcherService,
            );

            const spy = jest.spyOn(emitter, "dispatch");

            handler.emitEvents(bridgechainUpdateTransaction, emitter);

            expect(spy).toHaveBeenCalledWith(MagistrateApplicationEvents.BridgechainUpdate, expect.anything());
        });
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotBeApplied(bridgechainUpdateTransaction, senderWallet)).toResolve();
        });

        it("should not throw if asset.bridgechainUpdate.port is undefined", async () => {
            // @ts-ignore
            bridgechainUpdateTransaction.data.asset.bridgechainUpdate.ports = undefined;

            await expect(handler.throwIfCannotBeApplied(bridgechainUpdateTransaction, senderWallet)).toResolve();
        });

        it("should throw if wallet is not business", async () => {
            senderWallet.forgetAttribute("business");
            await expect(
                handler.throwIfCannotBeApplied(bridgechainUpdateTransaction, senderWallet),
            ).rejects.toThrowError(BusinessIsNotRegisteredError);
        });

        it("should throw if business is resigned", async () => {
            senderWallet.setAttribute("business.resigned", true);
            await expect(
                handler.throwIfCannotBeApplied(bridgechainUpdateTransaction, senderWallet),
            ).rejects.toThrowError(BusinessIsResignedError);
        });

        it("should throw if business asset is undefined", async () => {
            // @ts-ignore
            delete bridgechainUpdateTransaction.data.asset.bridgechainUpdate;
            await expect(
                handler.throwIfCannotBeApplied(bridgechainUpdateTransaction, senderWallet),
            ).rejects.toThrowError();
        });

        it("should throw if wallet has no registered bridgechains", async () => {
            const businessAttributes = senderWallet.getAttribute("business");
            delete businessAttributes.bridgechains;

            await expect(
                handler.throwIfCannotBeApplied(bridgechainUpdateTransaction, senderWallet),
            ).rejects.toThrowError(BridgechainIsNotRegisteredByWalletError);
        });

        it("should throw if bridgechain is not registered", async () => {
            bridgechainUpdateAsset.bridgechainId = "6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b";

            bridgechainUpdateTransaction = new BridgechainUpdateBuilder()
                .bridgechainUpdateAsset(bridgechainUpdateAsset)
                .nonce("1")
                .sign(passphrases[0])
                .build();

            await expect(
                handler.throwIfCannotBeApplied(bridgechainUpdateTransaction, senderWallet),
            ).rejects.toThrowError(BridgechainIsNotRegisteredByWalletError);
        });

        it("should throw if bridgechain is resigned", async () => {
            const businessAttributes = senderWallet.getAttribute("business");
            businessAttributes.bridgechains[bridgechainRegistrationAsset.genesisHash].resigned = true;

            await expect(
                handler.throwIfCannotBeApplied(bridgechainUpdateTransaction, senderWallet),
            ).rejects.toThrowError(BridgechainIsResignedError);
        });

        it("should throw if wallet is port name is invalid", async () => {
            bridgechainUpdateTransaction.data.asset!.bridgechainUpdate.ports = { "@arkecosystem/INVALID": 55555 };

            await expect(
                handler.throwIfCannotBeApplied(bridgechainUpdateTransaction, senderWallet),
            ).rejects.toThrowError(PortKeyMustBeValidPackageNameError);
        });
    });

    describe("throwIfCannotEnterPool", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotEnterPool(bridgechainUpdateTransaction)).toResolve();
        });

        it("should throw if transaction by sender already in pool", async () => {
            await app.get<Mempool>(Identifiers.TransactionPoolMempool).addTransaction(bridgechainUpdateTransaction);

            await expect(handler.throwIfCannotEnterPool(bridgechainUpdateTransaction)).rejects.toThrow(
                Contracts.TransactionPool.PoolError,
            );
        });
    });

    describe("apply", () => {
        it("should be ok", async () => {
            const senderBalance = senderWallet.getBalance();

            await handler.apply(bridgechainUpdateTransaction);

            const bridgechainUpdateAssetClone = Object.assign({}, bridgechainUpdateAsset);
            delete bridgechainUpdateAssetClone.bridgechainId;

            expect(
                senderWallet.getAttribute("business.bridgechains")[bridgechainRegistrationAsset.genesisHash]
                    .bridgechainAsset,
            ).toEqual({
                ...bridgechainRegistrationAsset,
                ...bridgechainUpdateAssetClone,
            });

            expect(senderWallet.getBalance()).toEqual(
                Utils.BigNumber.make(senderBalance)
                    .minus(bridgechainUpdateTransaction.data.amount)
                    .minus(bridgechainUpdateTransaction.data.fee),
            );
        });

        it("should throw if asset is undefined", async () => {
            bridgechainUpdateTransaction.data.asset = undefined;

            await expect(handler.apply(bridgechainUpdateTransaction)).rejects.toThrow();
        });

        it("should throw if asset.bridgechainUpdate is undefined", async () => {
            // @ts-ignore
            bridgechainUpdateTransaction.data.asset.bridgechainUpdate = undefined;

            await expect(handler.apply(bridgechainUpdateTransaction)).rejects.toThrow();
        });
    });

    describe("revert", () => {
        it("should be ok", async () => {
            const senderBalance = senderWallet.getBalance();

            const bridgechainUpdateAssetClone = Object.assign({}, bridgechainUpdateAsset);
            delete bridgechainUpdateAssetClone.bridgechainId;
            const asset = senderWallet.getAttribute("business.bridgechains");
            asset[bridgechainRegistrationAsset.genesisHash].bridgechainAsset = {
                ...bridgechainRegistrationAsset,
                ...bridgechainUpdateAssetClone,
            };
            senderWallet.setNonce(Utils.BigNumber.make("2"));

            const secondBridgechainUpdateAsset: IBridgechainUpdateAsset = {
                bridgechainId: bridgechainRegistrationAsset.genesisHash,
                seedNodes: [
                    "74.125.224.71",
                    "74.125.224.72",
                    "64.233.173.193",
                    "2001:4860:4860::8888",
                    "2001:4860:4860::8844",
                ],
                bridgechainRepository: "http://www.repository.com/myorg/myrepo/second",
                bridgechainAssetRepository: "http://www.repository.com/myorg/myassetrepo/second",
                ports: { "@arkecosystem/core-api": 54321 },
            };

            const secondBridgechainUpdateTransaction = new BridgechainUpdateBuilder()
                .bridgechainUpdateAsset(secondBridgechainUpdateAsset)
                .nonce("3")
                .sign(passphrases[0])
                .build();

            await handler.apply(secondBridgechainUpdateTransaction);

            const secondBridgechainUpdateAssetClone = Object.assign({}, secondBridgechainUpdateAsset);
            delete secondBridgechainUpdateAssetClone.bridgechainId;

            expect(
                senderWallet.getAttribute("business.bridgechains")[bridgechainRegistrationAsset.genesisHash]
                    .bridgechainAsset,
            ).toEqual({
                ...bridgechainRegistrationAsset,
                ...bridgechainUpdateAssetClone,
                ...secondBridgechainUpdateAssetClone,
            });

            transactionHistoryService.findManyByCriteria.mockResolvedValueOnce([
                bridgechainRegistrationTransaction.data,
                bridgechainUpdateTransaction.data,
                secondBridgechainUpdateTransaction.data,
            ]);

            await handler.revert(secondBridgechainUpdateTransaction);

            expect(
                senderWallet.getAttribute("business.bridgechains")[bridgechainRegistrationAsset.genesisHash]
                    .bridgechainAsset,
            ).toEqual({
                ...bridgechainRegistrationAsset,
                ...bridgechainUpdateAssetClone,
            });

            expect(senderWallet.getBalance()).toEqual(senderBalance);
        });
    });
});
