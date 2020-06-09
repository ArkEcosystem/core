import "@packages/core-test-framework/src/matchers/transactions/valid";

import { CryptoSuite } from "@packages/core-crypto";
import { Factories, FactoryBuilder } from "@packages/core-test-framework/src/factories";
import { Interfaces } from "@packages/crypto";

let factory: FactoryBuilder;
const crypto = new CryptoSuite.CryptoSuite();

beforeEach(() => {
    factory = new FactoryBuilder(crypto);

    Factories.registerTransactionFactory(factory);
});

describe("Valid", () => {
    describe("toBeValidTransaction", () => {
        it("should be valid transaction - with sign", async () => {
            const transaction: Interfaces.ITransaction = factory.get("Transfer").withStates("sign").make();

            expect(transaction.data.signature).toBeDefined();
            expect(transaction.data).toBeValidTransaction(crypto.TransactionManager.TransactionTools);
        });

        it("should not be valid transaction - without sign", async () => {
            const transaction: Interfaces.ITransaction = factory.get("Transfer").make();

            expect(transaction.data.signature).toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data).not.toBeValidTransaction(crypto.TransactionManager.TransactionTools);
        });
    });
});
