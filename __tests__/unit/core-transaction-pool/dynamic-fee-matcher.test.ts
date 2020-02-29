import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Interfaces, Utils } from "@arkecosystem/crypto";

import { DynamicFeeMatcher } from "../../../packages/core-transaction-pool/src/dynamic-fee-matcher";

describe("DynamicFeeMatcher", () => {
    const container = new Container.Container();
    const handler = { dynamicFee: jest.fn() };
    const configuration = { getRequired: jest.fn() };
    const handlerRegistry = { getActivatedHandlerForData: jest.fn(async () => handler) };
    const stateStore = { getLastHeight: jest.fn() };
    const logger = { debug: jest.fn(), notice: jest.fn() };

    beforeAll(() => {
        container.unbindAll();
        container.bind(Container.Identifiers.PluginConfiguration).toConstantValue(configuration);
        container.bind(Container.Identifiers.TransactionHandlerRegistry).toConstantValue(handlerRegistry);
        container.bind(Container.Identifiers.StateStore).toConstantValue(stateStore);
        container.bind(Container.Identifiers.LogService).toConstantValue(logger);
    });

    beforeEach(() => {
        handler.dynamicFee.mockClear();
        configuration.getRequired.mockClear();
        handlerRegistry.getActivatedHandlerForData.mockClear();
        stateStore.getLastHeight.mockClear();
        logger.debug.mockClear();
        logger.notice.mockClear();
    });

    describe("when dynamic fees are enabled", () => {
        const minFeePool = 500;
        const minFeeBroadcast = 501;
        const addonBytes = { transfer: 600 };
        const height = 100;

        beforeEach(() => {
            configuration.getRequired.mockReturnValueOnce({ enabled: true, minFeePool, minFeeBroadcast, addonBytes });
            stateStore.getLastHeight.mockReturnValueOnce(height);
            handler.dynamicFee.mockReturnValueOnce(new Utils.BigNumber(1000));
        });

        describe("canEnterPool", () => {
            it("should allow entering pool when fee is higher or equal than dynamic fee", async () => {
                const transaction = {
                    key: "transfer",
                    data: { fee: new Utils.BigNumber(1000) },
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
                    data: { fee: new Utils.BigNumber(999) },
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

        describe("canBroadcast", () => {
            it("should allow broadcast when fee is higher or equal than dynamic fee", async () => {
                const transaction = {
                    key: "transfer",
                    data: { fee: new Utils.BigNumber(1000) },
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
                    data: { fee: new Utils.BigNumber(999) },
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

        describe("canEnterPool", () => {
            it("should allow entering pool when fee equals static fee", async () => {
                const transaction = {
                    key: "transfer",
                    staticFee: new Utils.BigNumber(1000),
                    data: { fee: new Utils.BigNumber(1000) },
                };

                const dynamicFeeMatcher = container.resolve(DynamicFeeMatcher);
                const canEnterPool = await dynamicFeeMatcher.canEnterPool(transaction as Interfaces.ITransaction);

                expect(canEnterPool).toBe(true);
                expect(logger.debug).toBeCalled();
            });

            it("should not allow entering pool when fee does not equal static fee", async () => {
                const transaction = {
                    key: "transfer",
                    staticFee: new Utils.BigNumber(1000),
                    data: { fee: new Utils.BigNumber(1001) },
                };

                const dynamicFeeMatcher = container.resolve(DynamicFeeMatcher);
                const canEnterPool = await dynamicFeeMatcher.canEnterPool(transaction as Interfaces.ITransaction);

                expect(canEnterPool).toBe(false);
                expect(logger.notice).toBeCalled();
            });
        });

        describe("canBroadcast", () => {
            it("should allow entering pool when fee equals static fee", async () => {
                const transaction = {
                    key: "transfer",
                    staticFee: new Utils.BigNumber(1000),
                    data: { fee: new Utils.BigNumber(1000) },
                };

                const dynamicFeeMatcher = container.resolve(DynamicFeeMatcher);
                const canBroadcast = await dynamicFeeMatcher.canBroadcast(transaction as Interfaces.ITransaction);

                expect(canBroadcast).toBe(true);
                expect(logger.debug).toBeCalled();
            });

            it("should not allow entering pool when fee does not equal static fee", async () => {
                const transaction = {
                    key: "transfer",
                    staticFee: new Utils.BigNumber(1000),
                    data: { fee: new Utils.BigNumber(1001) },
                };

                const dynamicFeeMatcher = container.resolve(DynamicFeeMatcher);
                const canBroadcast = await dynamicFeeMatcher.canBroadcast(transaction as Interfaces.ITransaction);

                expect(canBroadcast).toBe(false);
                expect(logger.notice).toBeCalled();
            });
        });
    });
});
