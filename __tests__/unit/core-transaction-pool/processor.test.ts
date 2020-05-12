import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Identities, Managers, Transactions } from "@arkecosystem/crypto";

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

const logger = { warning: jest.fn(), error: jest.fn() };
const pool = { addTransaction: jest.fn() };
const dynamicFeeMatcher = { canEnterPool: jest.fn(), canBroadcast: jest.fn() };
const transactionBroadcaster = { broadcastTransactions: jest.fn() };
const factoryPool = { isTypeGroupSupported: jest.fn(), getTransactionFromData: jest.fn() };

const container = new Container.Container();
container.bind(Container.Identifiers.LogService).toConstantValue(logger);
container.bind(Container.Identifiers.TransactionPoolService).toConstantValue(pool);
container.bind(Container.Identifiers.TransactionPoolDynamicFeeMatcher).toConstantValue(dynamicFeeMatcher);
container.bind(Container.Identifiers.PeerTransactionBroadcaster).toConstantValue(transactionBroadcaster);
container.bind(Container.Identifiers.TransactionPoolFactoryPool).toConstantValue(factoryPool);

beforeEach(() => {
    logger.warning.mockReset();
    pool.addTransaction.mockReset();
    dynamicFeeMatcher.canEnterPool.mockReset();
    dynamicFeeMatcher.canBroadcast.mockReset();
    transactionBroadcaster.broadcastTransactions.mockReset();
    factoryPool.isTypeGroupSupported.mockReset();
    factoryPool.getTransactionFromData.mockReset();
});

describe("Processor.process", () => {
    it("should add eligible transactions to pool", async () => {
        factoryPool.isTypeGroupSupported.mockReturnValue(false);
        dynamicFeeMatcher.canEnterPool.mockReturnValueOnce(true).mockReturnValueOnce(false);

        const processor = container.resolve(Processor);
        await processor.process([transaction1.data, transaction2.data]);

        expect(dynamicFeeMatcher.canEnterPool).toBeCalledTimes(2);
        expect(pool.addTransaction).toBeCalledTimes(1);
        expect(dynamicFeeMatcher.canBroadcast).toBeCalledTimes(1);
        expect(transactionBroadcaster.broadcastTransactions).not.toBeCalled();

        expect(processor.accept).toEqual([transaction1.id]);
        expect(processor.broadcast).toEqual([]);
        expect(processor.invalid).toEqual([transaction2.id]);
        expect(processor.excess).toEqual([]);
        expect(processor.errors[transaction2.id]).toBeTruthy();
        expect(processor.errors[transaction2.id].type).toBe("ERR_LOW_FEE");
    });

    it("should add broadcast eligible transaction", async () => {
        factoryPool.isTypeGroupSupported.mockReturnValue(false);
        dynamicFeeMatcher.canEnterPool.mockReturnValueOnce(true).mockReturnValueOnce(true);
        dynamicFeeMatcher.canBroadcast.mockReturnValueOnce(true).mockReturnValueOnce(false);

        const processor = container.resolve(Processor);
        await processor.process([transaction1.data, transaction2.data]);

        expect(dynamicFeeMatcher.canEnterPool).toBeCalledTimes(2);
        expect(pool.addTransaction).toBeCalledTimes(2);
        expect(dynamicFeeMatcher.canBroadcast).toBeCalledTimes(2);
        expect(transactionBroadcaster.broadcastTransactions).toBeCalled();

        expect(processor.accept).toEqual([transaction1.id, transaction2.id]);
        expect(processor.broadcast).toEqual([transaction1.id]);
        expect(processor.invalid).toEqual([]);
        expect(processor.excess).toEqual([]);
        expect(processor.errors).toEqual(undefined);
    });

    it("should rethrow unexpected error", async () => {
        factoryPool.isTypeGroupSupported.mockReturnValue(false);
        dynamicFeeMatcher.canEnterPool.mockReturnValueOnce(true);
        pool.addTransaction.mockRejectedValueOnce(new Error("Unexpected error"));

        const processor = container.resolve(Processor);
        const promise = processor.process([transaction1.data, transaction2.data]);

        await expect(promise).rejects.toThrow();

        expect(dynamicFeeMatcher.canEnterPool).toBeCalledTimes(1);
        expect(pool.addTransaction).toBeCalledTimes(1);
        expect(dynamicFeeMatcher.canBroadcast).toBeCalledTimes(0);
        expect(transactionBroadcaster.broadcastTransactions).not.toBeCalled();

        expect(processor.accept).toEqual([]);
        expect(processor.broadcast).toEqual([]);
        expect(processor.invalid).toEqual([transaction1.id]);
        expect(processor.excess).toEqual([]);
        expect(processor.errors).toEqual(undefined);
    });

    it("should track excess transactions", async () => {
        const exceedsError = new Contracts.TransactionPool.PoolError("Exceeds", "ERR_EXCEEDS_MAX_COUNT", transaction1);

        factoryPool.isTypeGroupSupported.mockReturnValue(false);
        dynamicFeeMatcher.canEnterPool.mockReturnValueOnce(true);
        pool.addTransaction.mockRejectedValueOnce(exceedsError);

        const processor = container.resolve(Processor);
        await processor.process([transaction1.data]);

        expect(dynamicFeeMatcher.canEnterPool).toBeCalledTimes(1);
        expect(pool.addTransaction).toBeCalledTimes(1);
        expect(dynamicFeeMatcher.canBroadcast).toBeCalledTimes(0);
        expect(transactionBroadcaster.broadcastTransactions).not.toBeCalled();

        expect(processor.accept).toEqual([]);
        expect(processor.broadcast).toEqual([]);
        expect(processor.invalid).toEqual([transaction1.id]);
        expect(processor.excess).toEqual([transaction1.id]);
        expect(processor.errors[transaction1.id]).toBeTruthy();
        expect(processor.errors[transaction1.id].type).toBe("ERR_EXCEEDS_MAX_COUNT");
    });
});
