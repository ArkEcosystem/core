import "jest-extended";

import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import { SecondSignatureVerificationCache } from "@packages/core-transactions/src/cache/second-signature-verification";
import { Identities, Interfaces, Transactions } from "@packages/crypto";
import { BuilderFactory } from "@packages/crypto/dist/transactions";

describe("SecondSignatureVerificationCache", () => {
    let transaction: Interfaces.ITransaction;
    let cache: SecondSignatureVerificationCache;

    const createTransaction = (amount: string) => {
        return BuilderFactory.transfer()
            .recipientId(Identities.Address.fromPassphrase(passphrases[1]))
            .amount(amount)
            .sign(passphrases[0])
            .build();
    };

    beforeEach(() => {
        transaction = createTransaction("1");

        cache = new SecondSignatureVerificationCache();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should call verifier if no cached value is found", () => {
        const spyOnVerifier = jest.spyOn(Transactions.Verifier, "verifySecondSignature");

        cache.verifySecondSignature(transaction.data, "publicKey");

        expect(spyOnVerifier).toBeCalled();
    });

    it("should take cached value if called with same parameters", () => {
        const spyOnVerifier = jest.spyOn(Transactions.Verifier, "verifySecondSignature");

        const result1 = cache.verifySecondSignature(transaction.data, "publicKey");
        const result2 = cache.verifySecondSignature(transaction.data, "publicKey");

        expect(spyOnVerifier).toBeCalledTimes(1);
        expect(result1).toEqual(result2);
    });

    it("should not take cached value if called with different parameters", () => {
        const spyOnVerifier = jest.spyOn(Transactions.Verifier, "verifySecondSignature");

        cache.verifySecondSignature(transaction.data, "publicKey");
        cache.verifySecondSignature(transaction.data, "differentPublicKey");

        expect(spyOnVerifier).toBeCalledTimes(2);
    });

    it("should return correct values", () => {
        const spyOnVerifier = jest
            .spyOn(Transactions.Verifier, "verifySecondSignature")
            .mockReturnValueOnce(false)
            .mockReturnValueOnce(true);

        const transaction2 = createTransaction("2");

        expect(cache.verifySecondSignature(transaction.data, "publicKey")).toEqual(false);
        expect(cache.verifySecondSignature(transaction2.data, "publicKey")).toEqual(true);

        expect(spyOnVerifier).toBeCalledTimes(2);

        // Values from cache
        expect(cache.verifySecondSignature(transaction.data, "publicKey")).toEqual(false);
        expect(cache.verifySecondSignature(transaction2.data, "publicKey")).toEqual(true);

        expect(spyOnVerifier).toBeCalledTimes(2);
    });

    it("should throw error if transaction.id is undefined", () => {
        transaction.data.id = undefined;

        expect(() => cache.verifySecondSignature(transaction.data, "publicKey")).toThrowError("Missing transaction id");
    });

    it("should remove first inserted element when max size is exceeded", () => {
        const spyOnVerifier = jest.spyOn(Transactions.Verifier, "verifySecondSignature");

        const transaction2 = createTransaction("2");
        const transaction3 = createTransaction("3");

        cache.verifySecondSignature(transaction.data, "publicKey");
        cache.verifySecondSignature(transaction2.data, "publicKey");
        cache.verifySecondSignature(transaction3.data, "publicKey");
        cache.verifySecondSignature(transaction.data, "publicKey");

        expect(spyOnVerifier).toBeCalledTimes(4);
    });

    it("should clear cache", () => {
        const spyOnVerifier = jest.spyOn(Transactions.Verifier, "verifySecondSignature");

        cache.verifySecondSignature(transaction.data, "publicKey");
        cache.clear();
        cache.verifySecondSignature(transaction.data, "publicKey");

        expect(spyOnVerifier).toBeCalledTimes(2);
    });
});
