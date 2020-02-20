import { Container } from "@arkecosystem/core-kernel";
import { Interfaces, Transactions } from "@arkecosystem/crypto";

import { Processor } from "./processor";

jest.mock("@arkecosystem/crypto");

describe("Processor", () => {
    const container = new Container.Container();

    describe("process", () => {
        const logger = { warning: jest.fn() };
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
            (Transactions.TransactionFactory.fromData as jest.Mock).mockReset();

            logger.warning.mockReset();
            pool.addTransaction.mockReset();
            dynamicFeeMatcher.canEnterPool.mockReset();
            dynamicFeeMatcher.canBroadcast.mockReset();
            transactionBroadcaster.broadcastTransactions.mockReset();
        });

        it("should add eligible transactions to pool", async () => {
            (Transactions.TransactionFactory.fromData as jest.Mock).mockImplementation(d => ({ id: d.id }));

            const processor = container.resolve(Processor);
            dynamicFeeMatcher.canEnterPool.mockReturnValueOnce(true).mockReturnValueOnce(false);
            const data = ([
                { id: "id_eligible" },
                { id: "id_non_eligible" },
            ] as unknown) as Interfaces.ITransactionData[];

            await processor.process(data);

            expect(processor.accept).toEqual(["id_eligible"]);
            expect(processor.invalid).toEqual(["id_non_eligible"]);
            expect(processor.errors).toEqual({
                id_non_eligible: {
                    type: "ERR_LOW_FEE",
                    message: "Transaction id_non_eligible fee is to low to include in pool",
                },
            });
        });
    });
});
