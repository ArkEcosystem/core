import { TransactionStore } from "@packages/core-state/src/stores/transactions";
import { Factories, FactoryBuilder } from "@packages/core-test-framework/src/factories";
import { ITransaction } from "@packages/crypto/src/interfaces";

let factory: FactoryBuilder;

beforeEach(() => {
    factory = new FactoryBuilder();
    Factories.registerTransactionFactory(factory);
});

describe("TransactionStore", () => {
    it("should push and get a transaction", () => {
        const transaction: ITransaction = factory.get("Transfer").make();

        // TODO: set id using factory
        transaction.data.id = "1";

        const store = new TransactionStore(100);
        store.push(transaction.data);

        expect(store.count()).toBe(1);
        expect(store.get("1")).toEqual(transaction.data);
    });
});
