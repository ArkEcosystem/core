import { Container } from "@arkecosystem/core-kernel";
import { Enums } from "@arkecosystem/crypto";

import { FactoryPool } from "../../../packages/core-transaction-pool/src/factory-pool";

const createFactoryWorker = jest.fn();
const pluginConfiguration = { getRequired: jest.fn() };

const container = new Container.Container();
container.bind(Container.Identifiers.TransactionPoolFactoryWorkerFactory).toConstantValue(createFactoryWorker);
container.bind(Container.Identifiers.PluginConfiguration).toConstantValue(pluginConfiguration);

beforeEach(() => {
    createFactoryWorker.mockReset();
    pluginConfiguration.getRequired.mockReset();
});

describe("FactoryPool.initialize", () => {
    it("should create workers", () => {
        const workerCount = 5;
        pluginConfiguration.getRequired.mockReturnValueOnce(workerCount);

        container.resolve(FactoryPool);

        expect(pluginConfiguration.getRequired).toBeCalledWith("factoryPool.workerCount");
        expect(createFactoryWorker).toBeCalledTimes(workerCount);
    });
});

describe("FactoryPool.isTypeGroupSupported", () => {
    it("should return true when typeGroup is Enums.TransactionTypeGroup.Core", () => {
        const factoryPool = container.resolve(FactoryPool);
        const result = factoryPool.isTypeGroupSupported(Enums.TransactionTypeGroup.Core);
        expect(result).toBe(true);
    });

    it("should check plugin configuration when typeGroup is not Enums.TransactionTypeGroup.Core", () => {
        const factoryPool = container.resolve(FactoryPool);

        const cryptoPackages = [{ typeGroup: 2 }];
        pluginConfiguration.getRequired.mockReturnValueOnce(cryptoPackages);
        const result = factoryPool.isTypeGroupSupported(2);

        expect(pluginConfiguration.getRequired).toBeCalledWith("factoryPool.cryptoPackages");
        expect(result).toBe(true);
    });
});

describe("FactoryPool.getTransactionFromData", () => {
    it("should delegate call into worker with smallest queue", () => {
        const workerCount = 3;
        pluginConfiguration.getRequired.mockReturnValueOnce(workerCount);

        const worker1 = { getQueueSize: jest.fn(() => 5), getTransactionFromData: jest.fn() };
        const worker2 = { getQueueSize: jest.fn(() => 3), getTransactionFromData: jest.fn() };
        const worker3 = { getQueueSize: jest.fn(() => 4), getTransactionFromData: jest.fn() };
        createFactoryWorker.mockReturnValueOnce(worker1).mockReturnValueOnce(worker2).mockReturnValueOnce(worker3);

        const transactionData = {};
        const factoryPool = container.resolve(FactoryPool);
        factoryPool.getTransactionFromData(transactionData as any);

        expect(pluginConfiguration.getRequired).toBeCalledWith("factoryPool.workerCount");
        expect(worker1.getTransactionFromData).not.toBeCalled();
        expect(worker2.getTransactionFromData).toBeCalledWith(transactionData);
        expect(worker3.getTransactionFromData).not.toBeCalled();
    });
});
