import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Identities, Managers, Transactions } from "@arkecosystem/crypto";

import { TransactionFeeToLowError } from "../../../packages/core-transaction-pool/src/errors";
import { Processor } from "../../../packages/core-transaction-pool/src/processor";

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

const pool = { addTransaction: jest.fn() };
const dynamicFeeMatcher = { throwIfCannotEnterPool: jest.fn(), throwIfCannotBroadcast: jest.fn() };
const transactionBroadcaster = { broadcastTransactions: jest.fn() };
const workerPool = { isTypeGroupSupported: jest.fn(), getTransactionFromData: jest.fn() };

const container = new Container.Container();
container.bind(Container.Identifiers.TransactionPoolService).toConstantValue(pool);
container.bind(Container.Identifiers.TransactionPoolDynamicFeeMatcher).toConstantValue(dynamicFeeMatcher);
container.bind(Container.Identifiers.PeerTransactionBroadcaster).toConstantValue(transactionBroadcaster);
container.bind(Container.Identifiers.TransactionPoolWorkerPool).toConstantValue(workerPool);

beforeEach(() => {
    pool.addTransaction.mockReset();
    dynamicFeeMatcher.throwIfCannotEnterPool.mockReset();
    dynamicFeeMatcher.throwIfCannotBroadcast.mockReset();
    transactionBroadcaster.broadcastTransactions.mockReset();
    workerPool.isTypeGroupSupported.mockReset();
    workerPool.getTransactionFromData.mockReset();
});

describe("Processor.process", () => {
    it("should parse transactions through factory pool", async () => {
        workerPool.isTypeGroupSupported.mockReturnValue(true);
        workerPool.getTransactionFromData.mockResolvedValueOnce(transaction1).mockResolvedValueOnce(transaction2);
        dynamicFeeMatcher.throwIfCannotEnterPool
            .mockImplementationOnce(async (transaction) => {})
            .mockImplementationOnce(async (transaction) => {});
        dynamicFeeMatcher.throwIfCannotBroadcast
            .mockImplementationOnce(async (transaction) => {
                throw new TransactionFeeToLowError(transaction);
            })
            .mockImplementationOnce(async (transaction) => {
                throw new TransactionFeeToLowError(transaction);
            });

        const processor = container.resolve(Processor);
        await processor.process([transaction1.data, transaction2.data]);

        expect(dynamicFeeMatcher.throwIfCannotEnterPool).toBeCalledTimes(2);
        expect(pool.addTransaction).toBeCalledTimes(2);
        expect(dynamicFeeMatcher.throwIfCannotBroadcast).toBeCalledTimes(2);
        expect(transactionBroadcaster.broadcastTransactions).not.toBeCalled();

        expect(processor.accept).toEqual([transaction1.id, transaction2.id]);
        expect(processor.broadcast).toEqual([]);
        expect(processor.invalid).toEqual([]);
        expect(processor.excess).toEqual([]);
        expect(processor.errors).toBeUndefined();
    });

    it("should add eligible transactions to pool", async () => {
        workerPool.isTypeGroupSupported.mockReturnValue(false);

        dynamicFeeMatcher.throwIfCannotEnterPool
            .mockImplementationOnce(async (transaction) => {})
            .mockImplementationOnce(async (transaction) => {
                throw new TransactionFeeToLowError(transaction);
            });

        const processor = container.resolve(Processor);
        await processor.process([transaction1.data, transaction2.data]);

        expect(dynamicFeeMatcher.throwIfCannotEnterPool).toBeCalledTimes(2);
        expect(pool.addTransaction).toBeCalledTimes(1);
        expect(dynamicFeeMatcher.throwIfCannotBroadcast).toBeCalledTimes(1);
        expect(transactionBroadcaster.broadcastTransactions).toBeCalledTimes(1);

        expect(processor.accept).toEqual([transaction1.id]);
        expect(processor.broadcast).toEqual([transaction1.id]);
        expect(processor.invalid).toEqual([transaction2.id]);
        expect(processor.excess).toEqual([]);
        expect(processor.errors[transaction2.id]).toBeTruthy();
        expect(processor.errors[transaction2.id].type).toBe("ERR_LOW_FEE");
    });

    it("should add broadcast eligible transaction", async () => {
        workerPool.isTypeGroupSupported.mockReturnValue(false);

        dynamicFeeMatcher.throwIfCannotBroadcast
            .mockImplementationOnce(async (transaction) => {})
            .mockImplementationOnce(async (transaction) => {
                throw new TransactionFeeToLowError(transaction);
            });

        const processor = container.resolve(Processor);
        await processor.process([transaction1.data, transaction2.data]);

        expect(dynamicFeeMatcher.throwIfCannotEnterPool).toBeCalledTimes(2);
        expect(pool.addTransaction).toBeCalledTimes(2);
        expect(dynamicFeeMatcher.throwIfCannotBroadcast).toBeCalledTimes(2);
        expect(transactionBroadcaster.broadcastTransactions).toBeCalled();

        expect(processor.accept).toEqual([transaction1.id, transaction2.id]);
        expect(processor.broadcast).toEqual([transaction1.id]);
        expect(processor.invalid).toEqual([]);
        expect(processor.excess).toEqual([]);
        expect(processor.errors).toEqual(undefined);
    });

    it("should rethrow unexpected error", async () => {
        workerPool.isTypeGroupSupported.mockReturnValue(false);
        pool.addTransaction.mockRejectedValueOnce(new Error("Unexpected error"));

        const processor = container.resolve(Processor);
        const promise = processor.process([transaction1.data, transaction2.data]);

        await expect(promise).rejects.toThrow();

        expect(dynamicFeeMatcher.throwIfCannotEnterPool).toBeCalledTimes(1);
        expect(pool.addTransaction).toBeCalledTimes(1);
        expect(dynamicFeeMatcher.throwIfCannotBroadcast).toBeCalledTimes(0);
        expect(transactionBroadcaster.broadcastTransactions).not.toBeCalled();

        expect(processor.accept).toEqual([]);
        expect(processor.broadcast).toEqual([]);
        expect(processor.invalid).toEqual([transaction1.id]);
        expect(processor.excess).toEqual([]);
        expect(processor.errors).toEqual(undefined);
    });

    it("should track excess transactions", async () => {
        const exceedsError = new Contracts.TransactionPool.PoolError("Exceeds", "ERR_EXCEEDS_MAX_COUNT");

        workerPool.isTypeGroupSupported.mockReturnValue(false);
        pool.addTransaction.mockRejectedValueOnce(exceedsError);

        const processor = container.resolve(Processor);
        await processor.process([transaction1.data]);

        expect(dynamicFeeMatcher.throwIfCannotEnterPool).toBeCalledTimes(1);
        expect(pool.addTransaction).toBeCalledTimes(1);
        expect(dynamicFeeMatcher.throwIfCannotBroadcast).toBeCalledTimes(0);
        expect(transactionBroadcaster.broadcastTransactions).not.toBeCalled();

        expect(processor.accept).toEqual([]);
        expect(processor.broadcast).toEqual([]);
        expect(processor.invalid).toEqual([transaction1.id]);
        expect(processor.excess).toEqual([transaction1.id]);
        expect(processor.errors[transaction1.id]).toBeTruthy();
        expect(processor.errors[transaction1.id].type).toBe("ERR_EXCEEDS_MAX_COUNT");
    });
});
