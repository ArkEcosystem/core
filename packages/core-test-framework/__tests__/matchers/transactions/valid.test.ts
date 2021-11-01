import "@packages/core-test-framework/src/matchers/transactions/valid";
import { Factories, FactoryBuilder } from "@packages/core-test-framework/src/factories";
import { Interfaces } from "@packages/crypto";

let factory: FactoryBuilder;

beforeEach(() => {
    factory = new FactoryBuilder();

    Factories.registerTransactionFactory(factory);
});

describe("Valid", () => {
    describe("toBeValidTransaction", () => {
        it("should be valid transaction - with sign", async () => {
            const transaction: Interfaces.ITransaction = factory.get("Transfer").withStates("sign").make();

            expect(transaction.data.signature).toBeDefined();
            expect(transaction.data).toBeValidTransaction();
        });

        it("should not be valid transaction - without sign", async () => {
            const transaction: Interfaces.ITransaction = factory.get("Transfer").make();

            expect(transaction.data.signature).toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data).not.toBeValidTransaction();
        });
    });
});
