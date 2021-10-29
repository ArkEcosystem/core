import "@packages/core-test-framework/src/matchers/transactions/types/second-signature";
import { Factories, FactoryBuilder } from "@packages/core-test-framework/src/factories";
import { Interfaces } from "@packages/crypto";

let factory: FactoryBuilder;

beforeEach(() => {
    factory = new FactoryBuilder();

    Factories.registerTransactionFactory(factory);
});

describe("Second Signature", () => {
    describe("toBeSecondSignatureType", () => {
        it("should be second signature type", async () => {
            const transaction: Interfaces.ITransaction = factory.get("SecondSignature").make();

            expect(transaction.data).toBeSecondSignatureType();
        });

        it("should not be second signature type", async () => {
            const transaction: Interfaces.ITransaction = factory.get("Transfer").make();

            expect(transaction.data).not.toBeSecondSignatureType();
        });
    });
});
