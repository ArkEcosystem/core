import { Container } from "@arkecosystem/core-kernel";
import { Interfaces, Transactions } from "@arkecosystem/crypto";

import { Processor } from "./processor";

jest.mock("@arkecosystem/crypto/dist/transactions/factory");

describe("Processor", () => {
    let container: Container.Container;
    let logger: { warning: jest.Mock };
    let pool: { addTransaction: jest.Mock };
    let dynamicFeeMatcher: { canEnterPool: jest.Mock; canBroadcast: jest.Mock };
    let transactionBroadcaster: { broadcastTransactions: jest.Mock };

    beforeEach(() => {
        logger = { warning: jest.fn() };
        pool = { addTransaction: jest.fn() };
        dynamicFeeMatcher = { canEnterPool: jest.fn(), canBroadcast: jest.fn() };
        transactionBroadcaster = { broadcastTransactions: jest.fn() };

        container = new Container.Container();
        container.bind(Container.Identifiers.LogService).toConstantValue(logger);
        container.bind(Container.Identifiers.TransactionPoolService).toConstantValue(pool);
        container.bind(Container.Identifiers.TransactionPoolDynamicFeeMatcher).toConstantValue(dynamicFeeMatcher);
        container.bind(Container.Identifiers.PeerTransactionBroadcaster).toConstantValue(transactionBroadcaster);
    });

    it("should add eligible transactions to pool", async () => {
        const processor = container.resolve(Processor);
        const fromData = Transactions.TransactionFactory.fromData as jest.Mock;
        fromData.mockImplementation(d => ({ id: d.id }));
        dynamicFeeMatcher.canEnterPool.mockReturnValueOnce(true).mockReturnValueOnce(false);
        const data = ([{ id: "id_eligible" }, { id: "id_non_eligible" }] as unknown) as Interfaces.ITransactionData[];

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
