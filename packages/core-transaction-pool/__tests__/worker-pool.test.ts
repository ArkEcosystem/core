import { Container } from "@arkecosystem/core-kernel";
import { Enums } from "@arkecosystem/crypto";

import { WorkerPool } from "../../../packages/core-transaction-pool/src/worker-pool";

const createWorker = jest.fn();
const pluginConfiguration = { getRequired: jest.fn() };

const container = new Container.Container();
container.bind(Container.Identifiers.TransactionPoolWorkerFactory).toConstantValue(createWorker);
container.bind(Container.Identifiers.PluginConfiguration).toConstantValue(pluginConfiguration);

beforeEach(() => {
    createWorker.mockReset();
    pluginConfiguration.getRequired.mockReset();
});

describe("WorkerPool.initialize", () => {
    it("should create workers", () => {
        const workerCount = 5;
        const cryptoPackages = [{ typeGroup: 2, packageName: "@arkecosystem/core-magistrate-crypto" }];
        pluginConfiguration.getRequired.mockReturnValueOnce(workerCount).mockReturnValueOnce(cryptoPackages);

        const worker = { loadCryptoPackage: jest.fn() };
        createWorker.mockReturnValue(worker);

        container.resolve(WorkerPool);

        expect(pluginConfiguration.getRequired).toBeCalledWith("workerPool.workerCount");
        expect(pluginConfiguration.getRequired).toBeCalledWith("workerPool.cryptoPackages");
        expect(createWorker).toBeCalledTimes(workerCount);
        expect(worker.loadCryptoPackage).toBeCalledWith("@arkecosystem/core-magistrate-crypto");
        expect(worker.loadCryptoPackage).toBeCalledTimes(workerCount);
    });
});

describe("WorkerPool.isTypeGroupSupported", () => {
    it("should return true when typeGroup is Enums.TransactionTypeGroup.Core", () => {
        const workerPool = container.resolve(WorkerPool);
        const result = workerPool.isTypeGroupSupported(Enums.TransactionTypeGroup.Core);
        expect(result).toBe(true);
    });

    it("should check plugin configuration when typeGroup is not Enums.TransactionTypeGroup.Core", () => {
        const workerPool = container.resolve(WorkerPool);

        const cryptoPackages = [{ typeGroup: 2, packageName: "@arkecosystem/core-magistrate-crypto" }];
        pluginConfiguration.getRequired.mockReturnValueOnce(cryptoPackages);
        const result = workerPool.isTypeGroupSupported(2);

        expect(pluginConfiguration.getRequired).toBeCalledWith("workerPool.cryptoPackages");
        expect(result).toBe(true);
    });
});

describe("WorkerPool.getTransactionFromData", () => {
    it("should delegate call into worker with smallest queue", () => {
        const workerCount = 3;
        const cryptoPackages = [{ typeGroup: 2, packageName: "@arkecosystem/core-magistrate-crypto" }];
        pluginConfiguration.getRequired.mockReturnValueOnce(workerCount).mockReturnValueOnce(cryptoPackages);

        const worker1 = {
            loadCryptoPackage: jest.fn(),
            getQueueSize: jest.fn(() => 5),
            getTransactionFromData: jest.fn(),
        };
        const worker2 = {
            loadCryptoPackage: jest.fn(),
            getQueueSize: jest.fn(() => 3),
            getTransactionFromData: jest.fn(),
        };
        const worker3 = {
            loadCryptoPackage: jest.fn(),
            getQueueSize: jest.fn(() => 4),
            getTransactionFromData: jest.fn(),
        };
        createWorker.mockReturnValueOnce(worker1).mockReturnValueOnce(worker2).mockReturnValueOnce(worker3);

        const transactionData = {};
        const workerPool = container.resolve(WorkerPool);
        workerPool.getTransactionFromData(transactionData as any);

        expect(pluginConfiguration.getRequired).toBeCalledWith("workerPool.workerCount");
        expect(worker1.getTransactionFromData).not.toBeCalled();
        expect(worker2.getTransactionFromData).toBeCalledWith(transactionData);
        expect(worker3.getTransactionFromData).not.toBeCalled();
    });
});
