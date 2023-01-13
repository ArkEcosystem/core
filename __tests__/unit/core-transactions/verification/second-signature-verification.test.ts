import "jest-extended";

import { Application, Container, Exceptions } from "@packages/core-kernel";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import { SecondSignatureVerification } from "@packages/core-transactions/src/verification";
import { Identities, Interfaces, Transactions } from "@packages/crypto";
import { BuilderFactory } from "@packages/crypto/dist/transactions";

describe("SecondSignatureVerificationMemoized", () => {
    let transaction: Interfaces.ITransaction;

    let app: Application;
    let verification: SecondSignatureVerification;

    const createTransaction = (amount: string) => {
        return BuilderFactory.transfer()
            .recipientId(Identities.Address.fromPassphrase(passphrases[1]))
            .amount(amount)
            .sign(passphrases[0])
            .build();
    };

    beforeEach(() => {
        transaction = createTransaction("1");

        app = new Application(new Container.Container());

        verification = app.resolve(SecondSignatureVerification);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("verifySecondSignature", () => {
        it("should call verifySecondSignature", () => {
            const spyOnVerifier = jest.spyOn(Transactions.Verifier, "verifySecondSignature");

            verification.verifySecondSignature(transaction.data, "publicKey");

            expect(spyOnVerifier).toBeCalledWith(transaction.data, "publicKey");
        });
    });

    describe("clear", () => {
        it("should throw error", () => {
            expect(() => verification.clear(transaction.data.id)).toThrowError(Exceptions.Runtime.NotImplemented);
        });
    });
});
