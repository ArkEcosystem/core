import "@packages/core-test-framework/src/matchers/transactions/types/multi-payment"
import { Factories, FactoryBuilder } from "@arkecosystem/core-test-framework/src/factories";
import { Interfaces } from "@arkecosystem/crypto";

let factory: FactoryBuilder;

beforeEach(() => {
    factory = new FactoryBuilder();

    Factories.registerTransactionFactory(factory);
});

describe("Multi Payment", () => {
    describe("toBeMultiPaymentType", () => {

        it("should be multi payment type", async () => {
            const transaction: Interfaces.ITransaction = factory.get("MultiPayment").make();

            expect(transaction.data).toBeMultiPaymentType();
        });

        it("should not be multi payment type", async () => {
            const transaction: Interfaces.ITransaction = factory.get("Transfer").make();

            expect(transaction.data).not.toBeMultiPaymentType();
        });
    });
});
