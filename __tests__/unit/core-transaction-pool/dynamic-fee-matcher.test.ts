import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";
import { CryptoSuite } from "@packages/core-crypto";
import { DynamicFeeMatcher } from "@packages/core-transaction-pool/src/dynamic-fee-matcher";

const handler = { dynamicFee: jest.fn() };
const configuration = { getRequired: jest.fn() };
const handlerRegistry = { getActivatedHandlerForData: jest.fn() };
const stateStore = { getLastHeight: jest.fn() };
const logger = { debug: jest.fn(), notice: jest.fn() };

const container = new Container.Container();
container.bind(Container.Identifiers.PluginConfiguration).toConstantValue(configuration);
container.bind(Container.Identifiers.TransactionHandlerRegistry).toConstantValue(handlerRegistry);
container.bind(Container.Identifiers.StateStore).toConstantValue(stateStore);
container.bind(Container.Identifiers.LogService).toConstantValue(logger);
const crypto = new CryptoSuite.CryptoSuite(CryptoSuite.CryptoManager.findNetworkByName("testnet"));
crypto.CryptoManager.HeightTracker.setHeight(2);

container.bind(Container.Identifiers.CryptoManager).toConstantValue(crypto.CryptoManager);
container.bind(Container.Identifiers.TransactionManager).toConstantValue(crypto.TransactionManager);
container.bind(Container.Identifiers.BlockFactory).toConstantValue(crypto.BlockFactory);

beforeEach(() => {
    handler.dynamicFee.mockReset();
    configuration.getRequired.mockReset();
    handlerRegistry.getActivatedHandlerForData.mockReset();
    stateStore.getLastHeight.mockReset();
    logger.debug.mockReset();
    logger.notice.mockReset();

    handlerRegistry.getActivatedHandlerForData.mockResolvedValue(handler);
});

describe("when dynamic fees are enabled", () => {
    const minFeePool = 500;
    const minFeeBroadcast = 501;
    const addonBytes = { transfer: 600 };
    const height = 100;

    beforeEach(() => {
        configuration.getRequired.mockReturnValueOnce({ enabled: true, minFeePool, minFeeBroadcast, addonBytes });
        stateStore.getLastHeight.mockReturnValueOnce(height);
        handler.dynamicFee.mockReturnValueOnce(crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("1000"));
    });

    describe("DynamicFeeMatcher.canEnterPool", () => {
        it("should allow entering pool when fee is higher or equal than dynamic fee", async () => {
            const transaction = {
                key: "transfer",
                data: { fee: crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("1000") },
            } as Interfaces.ITransaction;

            const dynamicFeeMatcher = container.resolve(DynamicFeeMatcher);
            const canEnterPool = await dynamicFeeMatcher.canEnterPool(transaction);
            const dynamicFeeContext: Contracts.Shared.DynamicFeeContext = {
                transaction,
                addonBytes: addonBytes.transfer,
                satoshiPerByte: minFeePool,
                height,
            };

            expect(canEnterPool).toBe(true);
            expect(configuration.getRequired).toBeCalledWith("dynamicFees");
            expect(stateStore.getLastHeight).toBeCalled();
            expect(handler.dynamicFee).toBeCalledWith(dynamicFeeContext);
            expect(logger.debug).toBeCalled();
        });

        it("should not allow entering pool when fee is lower than dynamic fee", async () => {
            const transaction = {
                key: "transfer",
                data: { fee: crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("999") },
            } as Interfaces.ITransaction;

            const dynamicFeeMatcher = container.resolve(DynamicFeeMatcher);
            const canEnterPool = await dynamicFeeMatcher.canEnterPool(transaction);
            const dynamicFeeContext: Contracts.Shared.DynamicFeeContext = {
                transaction,
                addonBytes: addonBytes.transfer,
                satoshiPerByte: minFeePool,
                height,
            };

            expect(canEnterPool).toBe(false);
            expect(configuration.getRequired).toBeCalledWith("dynamicFees");
            expect(stateStore.getLastHeight).toBeCalled();
            expect(handler.dynamicFee).toBeCalledWith(dynamicFeeContext);
            expect(logger.notice).toBeCalled();
        });
    });

    describe("DynamicFeeMatcher.canBroadcast", () => {
        it("should allow broadcast when fee is higher or equal than dynamic fee", async () => {
            const transaction = {
                key: "transfer",
                data: { fee: crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("1000") },
            } as Interfaces.ITransaction;

            const dynamicFeeMatcher = container.resolve(DynamicFeeMatcher);
            const canBroadcast = await dynamicFeeMatcher.canBroadcast(transaction);
            const dynamicFeeContext: Contracts.Shared.DynamicFeeContext = {
                transaction,
                addonBytes: addonBytes.transfer,
                satoshiPerByte: minFeeBroadcast,
                height,
            };

            expect(canBroadcast).toBe(true);
            expect(configuration.getRequired).toBeCalledWith("dynamicFees");
            expect(stateStore.getLastHeight).toBeCalled();
            expect(handler.dynamicFee).toBeCalledWith(dynamicFeeContext);
            expect(logger.debug).toBeCalled();
        });

        it("should not allow broadcast when fee is lower than dynamic fee", async () => {
            const transaction = {
                key: "transfer",
                data: { fee: crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("999") },
            } as Interfaces.ITransaction;

            const dynamicFeeMatcher = container.resolve(DynamicFeeMatcher);
            const canBroadcast = await dynamicFeeMatcher.canBroadcast(transaction);
            const dynamicFeeContext: Contracts.Shared.DynamicFeeContext = {
                transaction,
                addonBytes: addonBytes.transfer,
                satoshiPerByte: minFeeBroadcast,
                height,
            };

            expect(canBroadcast).toBe(false);
            expect(configuration.getRequired).toBeCalledWith("dynamicFees");
            expect(stateStore.getLastHeight).toBeCalled();
            expect(handler.dynamicFee).toBeCalledWith(dynamicFeeContext);
            expect(logger.notice).toBeCalled();
        });
    });
});

describe("when dynamic fees are disabled", () => {
    beforeEach(() => {
        configuration.getRequired.mockReturnValueOnce({ enabled: false });
    });

    describe("DynamicFeeMatcher.canEnterPool", () => {
        it("should allow entering pool when fee equals static fee", async () => {
            const transaction = {
                key: "transfer",
                staticFee: crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("1000"),
                data: { fee: crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("1000") },
            };

            const dynamicFeeMatcher = container.resolve(DynamicFeeMatcher);
            const canEnterPool = await dynamicFeeMatcher.canEnterPool(transaction as Interfaces.ITransaction);

            expect(canEnterPool).toBe(true);
            expect(logger.debug).toBeCalled();
        });

        it("should not allow entering pool when fee does not equal static fee", async () => {
            const transaction = {
                key: "transfer",
                staticFee: crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("1000"),
                data: { fee: crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("1001") },
            };

            const dynamicFeeMatcher = container.resolve(DynamicFeeMatcher);
            const canEnterPool = await dynamicFeeMatcher.canEnterPool(transaction as Interfaces.ITransaction);

            expect(canEnterPool).toBe(false);
            expect(logger.notice).toBeCalled();
        });
    });

    describe("DynamicFeeMatcher.canBroadcast", () => {
        it("should allow entering pool when fee equals static fee", async () => {
            const transaction = {
                key: "transfer",
                staticFee: crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("1000"),
                data: { fee: crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("1000") },
            };

            const dynamicFeeMatcher = container.resolve(DynamicFeeMatcher);
            const canBroadcast = await dynamicFeeMatcher.canBroadcast(transaction as Interfaces.ITransaction);

            expect(canBroadcast).toBe(true);
            expect(logger.debug).toBeCalled();
        });

        it("should not allow entering pool when fee does not equal static fee", async () => {
            const transaction = {
                key: "transfer",
                staticFee: crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("1000"),
                data: { fee: crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("1001") },
            };

            const dynamicFeeMatcher = container.resolve(DynamicFeeMatcher);
            const canBroadcast = await dynamicFeeMatcher.canBroadcast(transaction as Interfaces.ITransaction);

            expect(canBroadcast).toBe(false);
            expect(logger.notice).toBeCalled();
        });
    });
});
