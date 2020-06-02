import { Container } from "@arkecosystem/core-kernel";

import { CryptoSuite } from "../../../packages/core-crypto";
import { Worker } from "../../../packages/core-transaction-pool/src/worker";

const crypto = new CryptoSuite.CryptoSuite(CryptoSuite.CryptoManager.findNetworkByName("testnet"));

const createWorkerSubprocess = jest.fn();

const container = new Container.Container();
container.bind(Container.Identifiers.TransactionPoolWorkerIpcSubprocessFactory).toConstantValue(createWorkerSubprocess);
container.bind(Container.Identifiers.CryptoManager).toConstantValue(crypto.CryptoManager);
container.bind(Container.Identifiers.TransactionManager).toConstantValue(crypto.TransactionManager);
container.bind(Container.Identifiers.BlockFactory).toConstantValue(crypto.BlockFactory);

beforeEach(() => {
    createWorkerSubprocess.mockReset();
});

describe("Worker.initialize", () => {
    it("should instantiate worker subprocess", () => {
        container.resolve(Worker);
        expect(createWorkerSubprocess).toBeCalled();
    });
});

describe("Worker.getQueueSize", () => {
    it("should return queue size from subprocess", () => {
        const ipcSubprocess = { getQueueSize: jest.fn() };
        createWorkerSubprocess.mockReturnValueOnce(ipcSubprocess);
        const worker = container.resolve(Worker);

        const queueSize = 5;
        ipcSubprocess.getQueueSize.mockReturnValueOnce(queueSize);

        const result = worker.getQueueSize();
        expect(result).toBe(queueSize);
    });
});

describe("Worker.loadCryptoPackage", () => {
    it("should send 'loadCryptoPackage' action to subprocess", () => {
        const ipcSubprocess = { sendAction: jest.fn() };
        createWorkerSubprocess.mockReturnValueOnce(ipcSubprocess);
        const worker = container.resolve(Worker);

        worker.loadCryptoPackage("some-package-name");

        expect(ipcSubprocess.sendAction).toBeCalledWith("loadCryptoPackage", "some-package-name");
    });
});

describe("Worker.getTransactionFromData", () => {
    it("should send 'getTransactionFromData' request to subprocess", async () => {
        crypto.CryptoManager.MilestoneManager.getMilestone().aip11 = true;

        const transaction = crypto.TransactionManager.BuilderFactory.transfer()
            .version(2)
            .amount("100")
            .recipientId(crypto.CryptoManager.Identities.Address.fromPassphrase("recipient's secret"))
            .nonce("1")
            .sign("sender's secret")
            .build();

        const ipcSubprocess = { sendAction: jest.fn(), sendRequest: jest.fn() };
        createWorkerSubprocess.mockReturnValueOnce(ipcSubprocess);
        const worker = container.resolve(Worker);

        ipcSubprocess.sendRequest.mockResolvedValueOnce({
            id: transaction.id,
            serialized: transaction.serialized.toString("hex"),
        });

        const result = await worker.getTransactionFromData(transaction.data);

        expect(ipcSubprocess.sendAction).toBeCalledWith("setConfig", crypto.CryptoManager.NetworkConfigManager.all());
        expect(ipcSubprocess.sendAction).toBeCalledWith("setHeight", crypto.CryptoManager.HeightTracker.getHeight());
        expect(ipcSubprocess.sendRequest).toBeCalledWith("getTransactionFromData", transaction.data);

        expect(result).toEqual(transaction);
    });
});
