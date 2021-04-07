import { Container } from "@packages/core-kernel";
import { Worker } from "@packages/core-transaction-pool/src/worker";
import { Identities, Managers, Transactions } from "@packages/crypto";

const createWorkerSubprocess = jest.fn();

const container = new Container.Container();
container.bind(Container.Identifiers.TransactionPoolWorkerIpcSubprocessFactory).toConstantValue(createWorkerSubprocess);

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
        Managers.configManager.getMilestone().aip11 = true;

        const transaction = Transactions.BuilderFactory.transfer()
            .version(2)
            .amount("100")
            .recipientId(Identities.Address.fromPassphrase("recipient's secret"))
            .nonce("1")
            .sign("sender's secret")
            .build();

        const ipcSubprocess = { sendAction: jest.fn(), sendRequest: jest.fn() };
        createWorkerSubprocess.mockReturnValueOnce(ipcSubprocess);
        const worker = container.resolve(Worker);

        ipcSubprocess.sendRequest.mockResolvedValueOnce({
            id: transaction.id,
            serialized: transaction.serialized.toString("hex"),
            isVerified: true,
        });

        const result = await worker.getTransactionFromData(transaction.data);

        expect(ipcSubprocess.sendAction).toBeCalledWith("setConfig", Managers.configManager.all());
        expect(ipcSubprocess.sendAction).toBeCalledWith("setHeight", Managers.configManager.getHeight());
        expect(ipcSubprocess.sendRequest).toBeCalledWith("getTransactionFromData", transaction.data);

        expect(result).toEqual(transaction);
    });
});
