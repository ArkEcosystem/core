import "@packages/core-test-framework/src/matchers/transactions/valid-second-signature";

import { CryptoSuite } from "@packages/core-crypto";
import { Factories, FactoryBuilder } from "@packages/core-test-framework/src/factories";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import { Interfaces } from "@packages/crypto";

let factory: FactoryBuilder;

let Identities;

beforeEach(() => {
    const crypto = new CryptoSuite.CryptoSuite();
    Identities = crypto.CryptoManager.Identities;
    factory = new FactoryBuilder();

    Factories.registerTransactionFactory(factory);
});

describe("Valid Second Signature", () => {
    describe("toHaveValidSecondSignature", () => {
        it("should be valid transaction - with second sign", async () => {
            const transaction: Interfaces.ITransaction = factory
                .get("Transfer")
                .withStates("sign", "secondSign")
                .make();

            expect(transaction.data.signature).toBeDefined();
            expect(transaction.data.secondSignature).toBeDefined();
            expect(transaction.data).toHaveValidSecondSignature({
                publicKey: Identities.PublicKey.fromPassphrase(passphrases[1]),
            });
        });

        it("should not be valid transaction - without sign", async () => {
            const transaction: Interfaces.ITransaction = factory.get("Transfer").make();

            expect(transaction.data.signature).toBeUndefined();
            expect(transaction.data.secondSignature).toBeUndefined();
            expect(transaction.data).not.toHaveValidSecondSignature({
                publicKey: Identities.PublicKey.fromPassphrase(passphrases[1]),
            });
        });
    });
});
