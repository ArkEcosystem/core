import "jest-extended";

import { Application, Container } from "@packages/core-kernel";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import { MultiSignatureVerificationMemoized } from "@packages/core-transactions/src/verification/multi-signature-verification-memoized";
import { Identities, Interfaces, Transactions } from "@packages/crypto";
import { BuilderFactory } from "@packages/crypto/dist/transactions";

describe("MultiSignatureVerificationMemoized", () => {
    let transaction: Interfaces.ITransaction;
    let multiSignatureAsset: Interfaces.IMultiSignatureAsset;

    let app: Application;
    let verification: MultiSignatureVerificationMemoized;

    const createTransaction = (amount: string) => {
        return BuilderFactory.transfer()
            .recipientId(Identities.Address.fromPassphrase(passphrases[1]))
            .amount(amount)
            .sign(passphrases[0])
            .build();
    };

    beforeEach(() => {
        transaction = createTransaction("1");
        multiSignatureAsset = {
            min: 2,
            publicKeys: ["publicKeys1", "publicKeys2"],
        };

        app = new Application(new Container.Container());

        verification = app.resolve(MultiSignatureVerificationMemoized);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("verifySignatures", () => {
        it("should call verifier if no cached value is found", () => {
            const spyOnVerifier = jest.spyOn(Transactions.Verifier, "verifySignatures");

            verification.verifySignatures(transaction.data, multiSignatureAsset);

            expect(spyOnVerifier).toBeCalled();
        });

        it("should take cached value if called with same parameters", () => {
            const spyOnVerifier = jest.spyOn(Transactions.Verifier, "verifySignatures");

            const result1 = verification.verifySignatures(transaction.data, multiSignatureAsset);
            const result2 = verification.verifySignatures(transaction.data, multiSignatureAsset);

            expect(spyOnVerifier).toBeCalledTimes(1);
            expect(result1).toEqual(result2);
        });

        it("should not take cached value if called with different parameters", () => {
            const spyOnVerifier = jest.spyOn(Transactions.Verifier, "verifySignatures");

            verification.verifySignatures(transaction.data, multiSignatureAsset);
            verification.verifySignatures(transaction.data, { ...multiSignatureAsset, min: 3 });

            expect(spyOnVerifier).toBeCalledTimes(2);
        });

        it("should return correct values", () => {
            const spyOnVerifier = jest
                .spyOn(Transactions.Verifier, "verifySignatures")
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(true);

            const transaction2 = createTransaction("2");

            expect(verification.verifySignatures(transaction.data, multiSignatureAsset)).toEqual(false);
            expect(verification.verifySignatures(transaction2.data, multiSignatureAsset)).toEqual(true);

            expect(spyOnVerifier).toBeCalledTimes(2);

            // Values from cache
            expect(verification.verifySignatures(transaction.data, multiSignatureAsset)).toEqual(false);
            expect(verification.verifySignatures(transaction2.data, multiSignatureAsset)).toEqual(true);

            expect(spyOnVerifier).toBeCalledTimes(2);
        });

        it("should throw error if transaction.id is undefined", () => {
            transaction.data.id = undefined;
            expect(() => verification.verifySignatures(transaction.data, multiSignatureAsset)).toThrowError();
        });
    });

    describe("clear", () => {
        it("should remove cached value by transaction id", () => {
            const spyOnVerifier = jest.spyOn(Transactions.Verifier, "verifySignatures");

            const result1 = verification.verifySignatures(transaction.data, multiSignatureAsset);
            const result2 = verification.verifySignatures(transaction.data, multiSignatureAsset);

            expect(spyOnVerifier).toBeCalledTimes(1);
            expect(result1).toEqual(result2);

            verification.clear(transaction.data.id);

            const result3 = verification.verifySignatures(transaction.data, multiSignatureAsset);

            expect(spyOnVerifier).toBeCalledTimes(2);
            expect(result1).toEqual(result3);
        });
    });
});
