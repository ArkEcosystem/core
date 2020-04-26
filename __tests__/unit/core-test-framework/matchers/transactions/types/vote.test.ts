import "@packages/core-test-framework/src/matchers/transactions/types/vote";
import { Factories, FactoryBuilder } from "@packages/core-test-framework/src/factories";
import { Interfaces } from "@packages/crypto";

let factory: FactoryBuilder;

beforeEach(() => {
    factory = new FactoryBuilder();

    Factories.registerTransactionFactory(factory);
});

describe("Vote", () => {
    describe("toBeVoteType", () => {
        it("should be vote type", async () => {
            const transaction: Interfaces.ITransaction = factory.get("Vote").make();

            expect(transaction.data).toBeVoteType();
        });

        it("should not be vote type", async () => {
            const transaction: Interfaces.ITransaction = factory.get("Transfer").make();

            expect(transaction.data).not.toBeVoteType();
        });
    });
});
