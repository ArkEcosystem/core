import "@packages/core-test-framework/src/matchers/transactions/types/delegate-registration";
import { Factories, FactoryBuilder } from "@packages/core-test-framework/src/factories";
import { Interfaces } from "@packages/crypto";

let factory: FactoryBuilder;

beforeEach(() => {
    factory = new FactoryBuilder();

    Factories.registerTransactionFactory(factory);
});

describe("Delegate Registration", () => {
    describe("toBeDelegateRegistrationType", () => {
        it("should be delegate registrations type", async () => {
            const transaction: Interfaces.ITransaction = factory.get("DelegateRegistration").make();

            expect(transaction.data).toBeDelegateRegistrationType();
        });

        it("should not be delegate registrations type", async () => {
            const transaction: Interfaces.ITransaction = factory.get("Transfer").make();

            expect(transaction.data).not.toBeDelegateRegistrationType();
        });
    });
});
