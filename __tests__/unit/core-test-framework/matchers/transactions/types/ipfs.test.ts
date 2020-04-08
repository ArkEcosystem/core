import "@packages/core-test-framework/src/matchers/transactions/types/ipfs";
import { Factories, FactoryBuilder } from "@packages/core-test-framework/src/factories";
import { Interfaces } from "@packages/crypto";

let factory: FactoryBuilder;

beforeEach(() => {
    factory = new FactoryBuilder();

    Factories.registerTransactionFactory(factory);
});

describe("IPFS", () => {
    describe("toBeIpfsType", () => {
        it("should be ipfs type", async () => {
            const transaction: Interfaces.ITransaction = factory.get("Ipfs").make();

            expect(transaction.data).toBeIpfsType();
        });

        it("should not be ipfs type", async () => {
            const transaction: Interfaces.ITransaction = factory.get("Transfer").make();

            expect(transaction.data).not.toBeIpfsType();
        });
    });
});
