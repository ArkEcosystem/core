import { Container } from "@arkecosystem/core-kernel";
import { Enums, Identities, Managers, Transactions } from "@arkecosystem/crypto";

import { Query, QueryIterable } from "../../../packages/core-transaction-pool/src/query";

const mempool = {
    getSenderMempools: jest.fn(),
    hasSenderMempool: jest.fn(),
    getSenderMempool: jest.fn(),
};

const container = new Container.Container();
container.bind(Container.Identifiers.TransactionPoolMempool).toConstantValue(mempool);

beforeEach(() => {
    mempool.getSenderMempools.mockReset();
    mempool.hasSenderMempool.mockReset();
    mempool.getSenderMempool.mockReset();
});

Managers.configManager.getMilestone().aip11 = true;
const sender1Transaction100 = Transactions.BuilderFactory.transfer()
    .version(2)
    .amount("100")
    .recipientId(Identities.Address.fromPassphrase("recipient's secret"))
    .nonce("1")
    .fee("100")
    .sign("sender1 secret")
    .build();
const sender1Transaction200 = Transactions.BuilderFactory.delegateRegistration()
    .usernameAsset("sender1")
    .version(2)
    .nonce("1")
    .fee("200")
    .sign("sender1 secret")
    .build();
const sender2Transaction100 = Transactions.BuilderFactory.transfer()
    .version(2)
    .amount("100")
    .recipientId(Identities.Address.fromPassphrase("recipient's secret"))
    .nonce("1")
    .fee("100")
    .sign("sender2 secret")
    .build();
const sender2Transaction200 = Transactions.BuilderFactory.delegateRegistration()
    .usernameAsset("sender2")
    .version(2)
    .nonce("1")
    .fee("200")
    .sign("sender2 secret")
    .build();

describe("Query.getAll", () => {
    it("should return transactions from all sender states", () => {
        mempool.getSenderMempools.mockReturnValueOnce([
            { getFromLatest: () => [sender1Transaction100, sender1Transaction200] },
            { getFromLatest: () => [sender2Transaction100, sender2Transaction200] },
        ]);

        const query = container.resolve(Query);
        const result = Array.from(query.getAll());

        expect(result).toStrictEqual([
            sender1Transaction100,
            sender1Transaction200,
            sender2Transaction100,
            sender2Transaction200,
        ]);
    });
});

describe("Query.getAllBySender", () => {
    it("should return transaction from specific sender state", () => {
        mempool.hasSenderMempool.mockReturnValueOnce(true);
        mempool.getSenderMempool.mockReturnValueOnce({
            getFromEarliest: () => [sender1Transaction100, sender1Transaction200],
        });

        const query = container.resolve(Query);
        const result = Array.from(query.getAllBySender("sender public key"));

        expect(result).toStrictEqual([sender1Transaction100, sender1Transaction200]);
        expect(mempool.hasSenderMempool).toBeCalledWith("sender public key");
        expect(mempool.getSenderMempool).toBeCalledWith("sender public key");
    });
});

describe("Query.getFromLowestPriority", () => {
    it("should return transactions reverse ordered by fee", () => {
        mempool.getSenderMempools.mockReturnValueOnce([
            { getFromLatest: () => [sender1Transaction200, sender1Transaction100] },
            { getFromLatest: () => [sender2Transaction100, sender2Transaction200] },
        ]);

        const query = container.resolve(Query);
        const result = Array.from(query.getFromLowestPriority());

        expect(result).toStrictEqual([
            sender2Transaction100,
            sender1Transaction200,
            sender1Transaction100,
            sender2Transaction200,
        ]);
    });
});

describe("Query.getFromHighestPriority", () => {
    it("should return transactions order by fee", () => {
        mempool.getSenderMempools.mockReturnValueOnce([
            { getFromEarliest: () => [sender1Transaction200, sender1Transaction100] },
            { getFromEarliest: () => [sender2Transaction100, sender2Transaction200] },
        ]);

        const query = container.resolve(Query);
        const result = Array.from(query.getFromHighestPriority());

        expect(result).toStrictEqual([
            sender1Transaction200,
            sender1Transaction100,
            sender2Transaction100,
            sender2Transaction200,
        ]);
    });
});

describe("QueryIterable.whereId", () => {
    it("should filter transactions by id", () => {
        const queryIterable = new QueryIterable([sender1Transaction100, sender1Transaction200]);
        const result = Array.from(queryIterable.whereId(sender1Transaction200.id));

        expect(result).toStrictEqual([sender1Transaction200]);
    });
});

describe("QueryIterable.whereType", () => {
    it("should filter transactions by type", () => {
        const queryIterable = new QueryIterable([sender1Transaction100, sender1Transaction200]);
        const result = Array.from(queryIterable.whereType(Enums.TransactionType.DelegateRegistration));

        expect(result).toStrictEqual([sender1Transaction200]);
    });
});

describe("QueryIterable.whereTypeGroup", () => {
    it("should filter transactions by typeGroup", () => {
        const queryIterable = new QueryIterable([sender1Transaction100, sender1Transaction200]);
        const result = Array.from(queryIterable.whereTypeGroup(Enums.TransactionTypeGroup.Core));

        expect(result).toStrictEqual([sender1Transaction100, sender1Transaction200]);
    });
});

describe("QueryIterable.whereVersion", () => {
    it("should filter transactions by version", () => {
        const queryIterable = new QueryIterable([sender1Transaction100, sender1Transaction200]);
        const result = Array.from(queryIterable.whereVersion(2));

        expect(result).toStrictEqual([sender1Transaction100, sender1Transaction200]);
    });
});

describe("QueryIterable.whereKind", () => {
    it("should filter transactions by type and typeGroup", () => {
        const queryIterable = new QueryIterable([
            sender1Transaction100,
            sender1Transaction200,
            sender2Transaction100,
            sender2Transaction200,
        ]);
        const result = Array.from(queryIterable.whereKind(sender1Transaction200));

        expect(result).toStrictEqual([sender1Transaction200, sender2Transaction200]);
    });
});

describe("QueryIterable.has", () => {
    it("should return true when there are matching transactions", () => {
        const queryIterable = new QueryIterable([sender1Transaction100, sender1Transaction200]);
        const result = queryIterable.whereType(Enums.TransactionType.DelegateRegistration).has();

        expect(result).toBe(true);
    });

    it("should return false when there are no matching transactions", () => {
        const queryIterable = new QueryIterable([sender1Transaction100, sender1Transaction200]);
        const result = queryIterable.whereType(Enums.TransactionType.HtlcClaim).has();

        expect(result).toBe(false);
    });
});

describe("QueryIterable.first", () => {
    it("should return first matching transaction", () => {
        const queryIterable = new QueryIterable([
            sender1Transaction100,
            sender1Transaction200,
            sender2Transaction100,
            sender2Transaction200,
        ]);
        const result = queryIterable.whereType(Enums.TransactionType.DelegateRegistration).first();

        expect(result).toBe(sender1Transaction200);
    });

    it("should throw where there are no matching transactions", () => {
        const queryIterable = new QueryIterable([sender1Transaction100, sender1Transaction200]);
        const check = () => queryIterable.whereType(Enums.TransactionType.HtlcClaim).first();

        expect(check).toThrow();
    });
});
