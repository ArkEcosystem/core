import "jest-extended";

import { Application, Container } from "@packages/core-kernel";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import { SecondSignatureVerificationMemoized } from "@packages/core-transactions/src/verification/second-signature-verification-memoized";
import { Identities, Interfaces, Transactions } from "@packages/crypto";
import { BuilderFactory } from "@packages/crypto/dist/transactions";

describe("SecondSignatureVerificationMemoized", () => {
    let transaction: Interfaces.ITransaction;

    let app: Application;
    let verification: SecondSignatureVerificationMemoized;

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

        verification = app.resolve(SecondSignatureVerificationMemoized);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("verifySecondSignature", () => {
        it("should call verifier if no cached value is found", () => {
            const spyOnVerifier = jest.spyOn(Transactions.Verifier, "verifySecondSignature");

            verification.verifySecondSignature(transaction.data, "publicKey");

            expect(spyOnVerifier).toBeCalled();
        });

        it("should take cached value if called with same parameters", () => {
            const spyOnVerifier = jest.spyOn(Transactions.Verifier, "verifySecondSignature");

            const result1 = verification.verifySecondSignature(transaction.data, "publicKey");
            const result2 = verification.verifySecondSignature(transaction.data, "publicKey");

            expect(spyOnVerifier).toBeCalledTimes(1);
            expect(result1).toEqual(result2);
        });

        it("should not take cached value if called with different parameters", () => {
            const spyOnVerifier = jest.spyOn(Transactions.Verifier, "verifySecondSignature");

            verification.verifySecondSignature(transaction.data, "publicKey");
            verification.verifySecondSignature(transaction.data, "differentPublicKey");

            expect(spyOnVerifier).toBeCalledTimes(2);
        });

        it("should return correct values", () => {
            const spyOnVerifier = jest
                .spyOn(Transactions.Verifier, "verifySecondSignature")
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(true);

            const transaction2 = createTransaction("2");

            expect(verification.verifySecondSignature(transaction.data, "publicKey")).toEqual(false);
            expect(verification.verifySecondSignature(transaction2.data, "publicKey")).toEqual(true);

            expect(spyOnVerifier).toBeCalledTimes(2);

            // Values from cache
            expect(verification.verifySecondSignature(transaction.data, "publicKey")).toEqual(false);
            expect(verification.verifySecondSignature(transaction2.data, "publicKey")).toEqual(true);

            expect(spyOnVerifier).toBeCalledTimes(2);
        });

        it("should throw error if transaction.id is undefined", () => {
            transaction.data.id = undefined;
            expect(() => verification.verifySecondSignature(transaction.data, "publicKey")).toThrowError();
        });
    });

    describe("clear", () => {
        it("should remove cached value by transaction id", () => {
            const spyOnVerifier = jest.spyOn(Transactions.Verifier, "verifySecondSignature");

            const result1 = verification.verifySecondSignature(transaction.data, "publicKey");
            const result2 = verification.verifySecondSignature(transaction.data, "publicKey");

            expect(spyOnVerifier).toBeCalledTimes(1);
            expect(result1).toEqual(result2);

            verification.clear(transaction.data.id);

            const result3 = verification.verifySecondSignature(transaction.data, "publicKey");

            expect(spyOnVerifier).toBeCalledTimes(2);
            expect(result1).toEqual(result3);
        });
    });
});
