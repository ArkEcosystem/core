import "@packages/core-test-framework/src/matchers/transactions/types/delegate-resignation";
import { Factories, FactoryBuilder } from "@packages/core-test-framework/src/factories";
import { Interfaces } from "@packages/crypto";

let factory: FactoryBuilder;

beforeEach(() => {
    factory = new FactoryBuilder();

    Factories.registerTransactionFactory(factory);
});

describe("Delegate Resignation", () => {
    describe("toBeDelegateResignationType", () => {
        it("should be delegate resignation type", async () => {
            const transaction: Interfaces.ITransaction = factory.get("DelegateResignation").make();

            expect(transaction.data).toBeDelegateResignationType();
        });

        it("should not be delegate resignation type", async () => {
            const transaction: Interfaces.ITransaction = factory.get("Transfer").make();

            expect(transaction.data).not.toBeDelegateResignationType();
        });
    });
});
