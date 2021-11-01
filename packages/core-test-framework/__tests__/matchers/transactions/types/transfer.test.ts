import "@packages/core-test-framework/src/matchers/transactions/types/transfer";
import { Factories, FactoryBuilder } from "@packages/core-test-framework/src/factories";
import { Interfaces } from "@packages/crypto";

let factory: FactoryBuilder;

beforeEach(() => {
    factory = new FactoryBuilder();

    Factories.registerTransactionFactory(factory);
});

describe("Transfer", () => {
    describe("toBeTransferType", () => {
        it("should be transfer type", async () => {
            const transaction: Interfaces.ITransaction = factory.get("Transfer").make();

            expect(transaction.data).toBeTransferType();
        });

        it("should not be transfer type", async () => {
            const transaction: Interfaces.ITransaction = factory.get("Ipfs").make();

            expect(transaction.data).not.toBeTransferType();
        });
    });
});
