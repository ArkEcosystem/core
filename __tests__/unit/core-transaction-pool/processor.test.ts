import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Interfaces, Transactions } from "@arkecosystem/crypto";

import { Processor } from "../../../packages/core-transaction-pool/src/processor";

jest.mock("@arkecosystem/crypto");

describe("Processor", () => {
    const container = new Container.Container();

    describe("process", () => {
        const logger = { warning: jest.fn(), error: jest.fn() };
        const pool = { addTransaction: jest.fn() };
        const dynamicFeeMatcher = { canEnterPool: jest.fn(), canBroadcast: jest.fn() };
        const transactionBroadcaster = { broadcastTransactions: jest.fn() };

        beforeAll(() => {
            container.unbindAll();
            container.bind(Container.Identifiers.LogService).toConstantValue(logger);
            container.bind(Container.Identifiers.TransactionPoolService).toConstantValue(pool);
            container.bind(Container.Identifiers.TransactionPoolDynamicFeeMatcher).toConstantValue(dynamicFeeMatcher);
            container.bind(Container.Identifiers.PeerTransactionBroadcaster).toConstantValue(transactionBroadcaster);
        });

        beforeEach(() => {
            (Transactions.TransactionFactory.fromData as jest.Mock).mockClear();

            logger.warning.mockClear();
            pool.addTransaction.mockClear();
            dynamicFeeMatcher.canEnterPool.mockClear();
            dynamicFeeMatcher.canBroadcast.mockClear();
            transactionBroadcaster.broadcastTransactions.mockClear();
        });

        it("should add eligible transactions to pool", async () => {
            const data: any[] = [{ id: "id1" }, { id: "id2" }];

            (Transactions.TransactionFactory.fromData as jest.Mock).mockImplementation(d => ({ id: d.id }));
            dynamicFeeMatcher.canEnterPool.mockReturnValueOnce(true).mockReturnValueOnce(false);

            const processor = container.resolve(Processor);
            await processor.process(data as Interfaces.ITransactionData[]);

            expect(dynamicFeeMatcher.canEnterPool).toBeCalledTimes(2);
            expect(pool.addTransaction).toBeCalledTimes(1);
            expect(dynamicFeeMatcher.canBroadcast).toBeCalledTimes(1);
            expect(transactionBroadcaster.broadcastTransactions).not.toBeCalled();

            expect(processor.accept).toEqual(["id1"]);
            expect(processor.broadcast).toEqual([]);
            expect(processor.invalid).toEqual(["id2"]);
            expect(processor.excess).toEqual([]);
            expect(processor.errors).toEqual({
                id2: {
                    type: "ERR_LOW_FEE",
                    message: "Transaction id2 fee is to low to include in pool",
                },
            });
        });

        it("should add broadcast eligible transaction", async () => {
            const data: any[] = [{ id: "id1" }, { id: "id2" }];

            (Transactions.TransactionFactory.fromData as jest.Mock).mockImplementation(d => ({ id: d.id }));
            dynamicFeeMatcher.canEnterPool.mockReturnValueOnce(true).mockReturnValueOnce(true);
            dynamicFeeMatcher.canBroadcast.mockReturnValueOnce(true).mockReturnValueOnce(false);

            const processor = container.resolve(Processor);
            await processor.process(data as Interfaces.ITransactionData[]);

            expect(dynamicFeeMatcher.canEnterPool).toBeCalledTimes(2);
            expect(pool.addTransaction).toBeCalledTimes(2);
            expect(dynamicFeeMatcher.canBroadcast).toBeCalledTimes(2);
            expect(transactionBroadcaster.broadcastTransactions).toBeCalled();

            expect(processor.accept).toEqual(["id1", "id2"]);
            expect(processor.broadcast).toEqual(["id1"]);
            expect(processor.invalid).toEqual([]);
            expect(processor.excess).toEqual([]);
            expect(processor.errors).toEqual(undefined);
        });

        it("should rethrow unexpected error", async () => {
            const data: any[] = [{ id: "id1" }];

            (Transactions.TransactionFactory.fromData as jest.Mock).mockImplementation(d => ({ id: d.id }));
            dynamicFeeMatcher.canEnterPool.mockReturnValueOnce(true);
            pool.addTransaction.mockRejectedValueOnce(new Error("Unexpected error"));

            const processor = container.resolve(Processor);
            const promise = processor.process(data as Interfaces.ITransactionData[]);

            await expect(promise).rejects.toThrow();

            expect(dynamicFeeMatcher.canEnterPool).toBeCalledTimes(1);
            expect(pool.addTransaction).toBeCalledTimes(1);
            expect(dynamicFeeMatcher.canBroadcast).toBeCalledTimes(0);
            expect(transactionBroadcaster.broadcastTransactions).not.toBeCalled();

            expect(processor.accept).toEqual([]);
            expect(processor.broadcast).toEqual([]);
            expect(processor.invalid).toEqual(["id1"]);
            expect(processor.excess).toEqual([]);
            expect(processor.errors).toEqual(undefined);
        });

        it("should track excess transactions", async () => {
            const data: any[] = [{ id: "id1" }];
            const exceedsError = new Contracts.TransactionPool.PoolError(
                "Exceeds",
                "ERR_EXCEEDS_MAX_COUNT",
                data[0] as Interfaces.ITransaction,
            );

            (Transactions.TransactionFactory.fromData as jest.Mock).mockImplementation(d => ({ id: d.id }));
            dynamicFeeMatcher.canEnterPool.mockReturnValueOnce(true);
            pool.addTransaction.mockRejectedValueOnce(exceedsError);

            const processor = container.resolve(Processor);
            await processor.process(data as Interfaces.ITransactionData[]);

            expect(dynamicFeeMatcher.canEnterPool).toBeCalledTimes(1);
            expect(pool.addTransaction).toBeCalledTimes(1);
            expect(dynamicFeeMatcher.canBroadcast).toBeCalledTimes(0);
            expect(transactionBroadcaster.broadcastTransactions).not.toBeCalled();

            expect(processor.accept).toEqual([]);
            expect(processor.broadcast).toEqual([]);
            expect(processor.invalid).toEqual(["id1"]);
            expect(processor.excess).toEqual(["id1"]);
            expect(processor.errors).toEqual({
                id1: {
                    type: "ERR_EXCEEDS_MAX_COUNT",
                    message: "Exceeds",
                },
            });
        });
    });
});
