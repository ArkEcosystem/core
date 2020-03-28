import "@packages/core-test-framework/src/matchers/transactions/types/multi-signature";
import { Factories, FactoryBuilder } from "@packages/core-test-framework/src/factories";
import { Interfaces } from "@packages/crypto";

let factory: FactoryBuilder;

beforeEach(() => {
    factory = new FactoryBuilder();

    Factories.registerTransactionFactory(factory);
});

describe("Multi Signature", () => {
    describe("toBeMultiSignatureType", () => {
        it("should be multi signature type", async () => {
            const transaction: Interfaces.ITransaction = factory.get("MultiSignature").make();

            expect(transaction.data).toBeMultiSignatureType();
        });

        it("should not be multi signature type", async () => {
            const transaction: Interfaces.ITransaction = factory.get("Transfer").make();

            expect(transaction.data).not.toBeMultiSignatureType();
        });
    });
});
