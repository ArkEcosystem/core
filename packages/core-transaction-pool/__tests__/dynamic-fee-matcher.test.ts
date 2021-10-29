import "jest-extended";

import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Interfaces, Utils } from "@arkecosystem/crypto";

import { DynamicFeeMatcher } from "../../../packages/core-transaction-pool/src/dynamic-fee-matcher";
import {
    TransactionFeeToHighError,
    TransactionFeeToLowError,
} from "../../../packages/core-transaction-pool/src/errors";

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
        handler.dynamicFee.mockReturnValueOnce(new Utils.BigNumber(1000));
    });

    describe("DynamicFeeMatcher.throwIfCannotEnterPool", () => {
        it("should allow entering pool when fee is higher or equal than dynamic fee", async () => {
            const transaction = {
                key: "transfer",
                data: { fee: new Utils.BigNumber(1000) },
            } as Interfaces.ITransaction;

            const dynamicFeeMatcher = container.resolve(DynamicFeeMatcher);
            const dynamicFeeContext: Contracts.Shared.DynamicFeeContext = {
                transaction,
                addonBytes: addonBytes.transfer,
                satoshiPerByte: minFeePool,
                height,
            };

            await expect(dynamicFeeMatcher.throwIfCannotEnterPool(transaction)).toResolve();

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
            const dynamicFeeContext: Contracts.Shared.DynamicFeeContext = {
                transaction,
                addonBytes: addonBytes.transfer,
                satoshiPerByte: minFeePool,
                height,
            };

            await expect(dynamicFeeMatcher.throwIfCannotEnterPool(transaction)).rejects.toThrowError(
                TransactionFeeToLowError,
            );

            expect(configuration.getRequired).toBeCalledWith("dynamicFees");
            expect(stateStore.getLastHeight).toBeCalled();
            expect(handler.dynamicFee).toBeCalledWith(dynamicFeeContext);
            expect(logger.notice).toBeCalled();
        });
    });

    describe("DynamicFeeMatcher.throwIfCannotBroadcast", () => {
        it("should allow broadcast when fee is higher or equal than dynamic fee", async () => {
            const transaction = {
                key: "transfer",
                data: { fee: new Utils.BigNumber(1000) },
            } as Interfaces.ITransaction;

            const dynamicFeeMatcher = container.resolve(DynamicFeeMatcher);
            const dynamicFeeContext: Contracts.Shared.DynamicFeeContext = {
                transaction,
                addonBytes: addonBytes.transfer,
                satoshiPerByte: minFeeBroadcast,
                height,
            };

            await expect(dynamicFeeMatcher.throwIfCannotBroadcast(transaction)).toResolve();

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
            await expect(dynamicFeeMatcher.throwIfCannotBroadcast(transaction)).rejects.toThrowError(
                TransactionFeeToLowError,
            );
            const dynamicFeeContext: Contracts.Shared.DynamicFeeContext = {
                transaction,
                addonBytes: addonBytes.transfer,
                satoshiPerByte: minFeeBroadcast,
                height,
            };

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

    describe("DynamicFeeMatcher.throwIfCannotEnterPool", () => {
        it("should allow entering pool when fee equals static fee", async () => {
            const transaction = {
                key: "transfer",
                staticFee: new Utils.BigNumber(1000),
                data: { fee: new Utils.BigNumber(1000) },
            };

            const dynamicFeeMatcher = container.resolve(DynamicFeeMatcher);
            await expect(dynamicFeeMatcher.throwIfCannotEnterPool(transaction as Interfaces.ITransaction)).toResolve();

            expect(logger.debug).toBeCalled();
        });

        it("should not allow entering pool when fee is lower than static fee", async () => {
            const transaction = {
                key: "transfer",
                staticFee: new Utils.BigNumber(1000),
                data: { fee: new Utils.BigNumber(999) },
            };

            const dynamicFeeMatcher = container.resolve(DynamicFeeMatcher);
            await expect(
                dynamicFeeMatcher.throwIfCannotEnterPool(transaction as Interfaces.ITransaction),
            ).rejects.toThrowError(TransactionFeeToLowError);

            expect(logger.notice).toBeCalled();
        });

        it("should not allow entering pool when fee is higher than static fee", async () => {
            const transaction = {
                key: "transfer",
                staticFee: new Utils.BigNumber(1000),
                data: { fee: new Utils.BigNumber(1001) },
            };

            const dynamicFeeMatcher = container.resolve(DynamicFeeMatcher);
            await expect(
                dynamicFeeMatcher.throwIfCannotEnterPool(transaction as Interfaces.ITransaction),
            ).rejects.toThrowError(TransactionFeeToHighError);

            expect(logger.notice).toBeCalled();
        });
    });

    describe("DynamicFeeMatcher.throwIfCannotBroadcast", () => {
        it("should allow entering pool when fee equals static fee", async () => {
            const transaction = {
                key: "transfer",
                staticFee: new Utils.BigNumber(1000),
                data: { fee: new Utils.BigNumber(1000) },
            };

            const dynamicFeeMatcher = container.resolve(DynamicFeeMatcher);
            await expect(dynamicFeeMatcher.throwIfCannotBroadcast(transaction as Interfaces.ITransaction)).toResolve();

            expect(logger.debug).toBeCalled();
        });

        it("should not allow entering pool when fee is lower than static fee", async () => {
            const transaction = {
                key: "transfer",
                staticFee: new Utils.BigNumber(1000),
                data: { fee: new Utils.BigNumber(999) },
            };

            const dynamicFeeMatcher = container.resolve(DynamicFeeMatcher);
            await expect(
                dynamicFeeMatcher.throwIfCannotBroadcast(transaction as Interfaces.ITransaction),
            ).rejects.toThrowError(TransactionFeeToLowError);

            expect(logger.notice).toBeCalled();
        });

        it("should not allow entering pool when fee is higher than static fee", async () => {
            const transaction = {
                key: "transfer",
                staticFee: new Utils.BigNumber(1000),
                data: { fee: new Utils.BigNumber(1001) },
            };

            const dynamicFeeMatcher = container.resolve(DynamicFeeMatcher);
            await expect(
                dynamicFeeMatcher.throwIfCannotBroadcast(transaction as Interfaces.ITransaction),
            ).rejects.toThrowError(TransactionFeeToHighError);

            expect(logger.notice).toBeCalled();
        });
    });
});
