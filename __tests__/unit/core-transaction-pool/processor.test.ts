import { Container, Contracts } from "@packages/core-kernel";
import { TransactionFeeToLowError } from "@packages/core-transaction-pool/src/errors";
import { Processor } from "@packages/core-transaction-pool/src/processor";
import { Identities, Managers, Transactions } from "@packages/crypto";

Managers.configManager.getMilestone().aip11 = true;
const transaction1 = Transactions.BuilderFactory.transfer()
    .version(2)
    .amount("100")
    .recipientId(Identities.Address.fromPassphrase("recipient's secret"))
    .nonce("1")
    .sign("sender's secret")
    .build();
const transaction2 = Transactions.BuilderFactory.transfer()
    .version(2)
    .amount("100")
    .recipientId(Identities.Address.fromPassphrase("recipient's secret"))
    .nonce("2")
    .sign("sender's secret")
    .build();

transaction2.data.typeGroup = undefined;

const pool = { addTransaction: jest.fn() };
const extensions = [{ throwIfCannotBroadcast: jest.fn() }, { throwIfCannotBroadcast: jest.fn() }];
const spyBroadcastTransactions = jest.fn();
const transactionBroadcaster = {
    broadcastTransactions: () => {
        spyBroadcastTransactions(); // some weird issue with jest, can't use directly jest.fn() mocking promise so using this trick
        return Promise.resolve();
    },
};
const workerPool = { isTypeGroupSupported: jest.fn(), getTransactionFromData: jest.fn() };
const logger = { error: jest.fn() };

const container = new Container.Container();
container.bind(Container.Identifiers.TransactionPoolProcessorExtension).toConstantValue(extensions[0]);
container.bind(Container.Identifiers.TransactionPoolProcessorExtension).toConstantValue(extensions[1]);
container.bind(Container.Identifiers.TransactionPoolService).toConstantValue(pool);
container.bind(Container.Identifiers.PeerTransactionBroadcaster).toConstantValue(transactionBroadcaster);
container.bind(Container.Identifiers.TransactionPoolWorkerPool).toConstantValue(workerPool);
container.bind(Container.Identifiers.LogService).toConstantValue(logger);

beforeEach(() => {
    jest.resetAllMocks();
});

describe("Processor.process", () => {
    it("should parse transactions through factory pool", async () => {
        workerPool.isTypeGroupSupported.mockReturnValue(true);
        workerPool.getTransactionFromData.mockResolvedValueOnce(transaction1).mockResolvedValueOnce(transaction2);

        extensions[0].throwIfCannotBroadcast
            .mockImplementationOnce(async (transaction) => {
                throw new TransactionFeeToLowError(transaction);
            })
            .mockImplementationOnce(async (transaction) => {
                throw new TransactionFeeToLowError(transaction);
            });

        const processor = container.resolve(Processor);
        const result = await processor.process([transaction1.data, transaction2.data]);

        expect(pool.addTransaction).toBeCalledTimes(2);
        expect(extensions[0].throwIfCannotBroadcast).toBeCalledTimes(2);
        expect(extensions[1].throwIfCannotBroadcast).toBeCalledTimes(2);
        expect(spyBroadcastTransactions).not.toBeCalled();

        expect(result.accept).toEqual([transaction1.id, transaction2.id]);
        expect(result.broadcast).toEqual([]);
        expect(result.invalid).toEqual([]);
        expect(result.excess).toEqual([]);
        expect(result.errors).toBeUndefined();
    });

    it("should wrap deserialize errors into BAD_DATA pool error", async () => {
        const processor = container.resolve(Processor);

        workerPool.isTypeGroupSupported.mockReturnValueOnce(true);
        workerPool.getTransactionFromData.mockRejectedValueOnce(new Error("Version 1 not supported"));

        const result = await processor.process([transaction1.data]);

        expect(workerPool.isTypeGroupSupported).toBeCalledWith(transaction1.data.typeGroup);
        expect(workerPool.getTransactionFromData).toBeCalledWith(transaction1.data);

        expect(result.invalid).toEqual([transaction1.id]);
        expect(result.errors).toEqual({
            [transaction1.data.id]: {
                type: "ERR_BAD_DATA",
                message: "Invalid transaction data: Version 1 not supported",
            },
        });
    });

    it("should add transactions to pool", async () => {
        workerPool.isTypeGroupSupported.mockReturnValue(false);

        pool.addTransaction
            .mockImplementationOnce(async (transaction) => {})
            .mockImplementationOnce(async (transaction) => {
                throw new TransactionFeeToLowError(transaction);
            });

        const processor = container.resolve(Processor);
        const result = await processor.process([transaction1.data, transaction2.data]);

        expect(pool.addTransaction).toBeCalledTimes(2);
        expect(extensions[0].throwIfCannotBroadcast).toBeCalledTimes(1);
        expect(extensions[1].throwIfCannotBroadcast).toBeCalledTimes(1);
        expect(spyBroadcastTransactions).toBeCalledTimes(1);

        expect(result.accept).toEqual([transaction1.id]);
        expect(result.broadcast).toEqual([transaction1.id]);
        expect(result.invalid).toEqual([transaction2.id]);
        expect(result.excess).toEqual([]);
        expect(result.errors[transaction2.id]).toBeTruthy();
        expect(result.errors[transaction2.id].type).toBe("ERR_LOW_FEE");
    });

    it("should add broadcast eligible transaction", async () => {
        workerPool.isTypeGroupSupported.mockReturnValue(false);

        extensions[0].throwIfCannotBroadcast
            .mockImplementationOnce(async (transaction) => {})
            .mockImplementationOnce(async (transaction) => {
                throw new TransactionFeeToLowError(transaction);
            });

        const processor = container.resolve(Processor);
        const result = await processor.process([transaction1.data, transaction2.data]);

        expect(pool.addTransaction).toBeCalledTimes(2);
        expect(extensions[0].throwIfCannotBroadcast).toBeCalledTimes(2);
        expect(extensions[1].throwIfCannotBroadcast).toBeCalledTimes(2);
        expect(spyBroadcastTransactions).toBeCalled();

        expect(result.accept).toEqual([transaction1.id, transaction2.id]);
        expect(result.broadcast).toEqual([transaction1.id]);
        expect(result.invalid).toEqual([]);
        expect(result.excess).toEqual([]);
        expect(result.errors).toEqual(undefined);
    });

    it("should rethrow unexpected error", async () => {
        workerPool.isTypeGroupSupported.mockReturnValue(false);
        pool.addTransaction.mockRejectedValueOnce(new Error("Unexpected error"));

        const processor = container.resolve(Processor);
        const promise = processor.process([transaction1.data, transaction2.data]);

        await expect(promise).rejects.toThrow();

        expect(pool.addTransaction).toBeCalledTimes(1);
        expect(extensions[0].throwIfCannotBroadcast).toBeCalledTimes(0);
        expect(extensions[1].throwIfCannotBroadcast).toBeCalledTimes(0);
        expect(spyBroadcastTransactions).not.toBeCalled();
    });

    it("should track excess transactions", async () => {
        const exceedsError = new Contracts.TransactionPool.PoolError("Exceeds", "ERR_EXCEEDS_MAX_COUNT");

        workerPool.isTypeGroupSupported.mockReturnValue(false);
        pool.addTransaction.mockRejectedValueOnce(exceedsError);

        const processor = container.resolve(Processor);
        const result = await processor.process([transaction1.data]);

        expect(pool.addTransaction).toBeCalledTimes(1);
        expect(extensions[0].throwIfCannotBroadcast).toBeCalledTimes(0);
        expect(extensions[1].throwIfCannotBroadcast).toBeCalledTimes(0);
        expect(spyBroadcastTransactions).not.toBeCalled();

        expect(result.accept).toEqual([]);
        expect(result.broadcast).toEqual([]);
        expect(result.invalid).toEqual([transaction1.id]);
        expect(result.excess).toEqual([transaction1.id]);
        expect(result.errors[transaction1.id]).toBeTruthy();
        expect(result.errors[transaction1.id].type).toBe("ERR_EXCEEDS_MAX_COUNT");
    });
});
