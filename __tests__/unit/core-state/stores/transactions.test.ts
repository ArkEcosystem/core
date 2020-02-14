import { TransactionStore } from "../../../../packages/core-state/src/stores/transactions";
import { Interfaces } from "@packages/crypto/src";
import { FactoryBuilder, Factories } from "@packages/core-test-framework/src/factories";

let factory: FactoryBuilder;

beforeEach(() => {
    factory = new FactoryBuilder();
    Factories.registerTransactionFactory(factory);
});

describe("TransactionStore", () => {
    it("should push and get a transaction", () => {
        const transaction: Interfaces.ITransaction = factory
                .get("Transfer")
                .make();

        // TODO: set id using factory
        transaction.data.id = "1";

        const store = new TransactionStore(100);
        store.push(transaction.data);

        expect(store.count()).toBe(1);
        expect(store.get("1")).toEqual(transaction.data);
    });
});