import "jest-extended";

import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import { SecondSignatureVerificationMemoizer } from "@packages/core-transactions/src/memoizers/second-signature-verification";
import { Identities, Interfaces, Transactions } from "@packages/crypto";
import { BuilderFactory } from "@packages/crypto/dist/transactions";
import { Application, Container, Providers } from "@packages/core-kernel";

describe("SecondSignatureVerificationMemoizer", () => {
    let transaction: Interfaces.ITransaction;

    let app: Application;
    let memoizer: SecondSignatureVerificationMemoizer;

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

        const pluginConfiguration = app.resolve<Providers.PluginConfiguration>(Providers.PluginConfiguration);
        const pluginConfigurationInstance: Providers.PluginConfiguration = pluginConfiguration.from(
            "core-transactions",
            {
                memoizerCacheSize: 2,
            },
        );
        app.bind(Container.Identifiers.PluginConfiguration)
            .toConstantValue(pluginConfigurationInstance)
            .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("plugin", "@arkecosystem/core-transactions"));

        memoizer = app.resolve(SecondSignatureVerificationMemoizer);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should call verifier if no cached value is found", () => {
        const spyOnVerifier = jest.spyOn(Transactions.Verifier, "verifySecondSignature");

        memoizer.verifySecondSignature(transaction.data, "publicKey");

        expect(spyOnVerifier).toBeCalled();
    });

    it("should take cached value if called with same parameters", () => {
        const spyOnVerifier = jest.spyOn(Transactions.Verifier, "verifySecondSignature");

        const result1 = memoizer.verifySecondSignature(transaction.data, "publicKey");
        const result2 = memoizer.verifySecondSignature(transaction.data, "publicKey");

        expect(spyOnVerifier).toBeCalledTimes(1);
        expect(result1).toEqual(result2);
    });

    it("should not take cached value if called with different parameters", () => {
        const spyOnVerifier = jest.spyOn(Transactions.Verifier, "verifySecondSignature");

        memoizer.verifySecondSignature(transaction.data, "publicKey");
        memoizer.verifySecondSignature(transaction.data, "differentPublicKey");

        expect(spyOnVerifier).toBeCalledTimes(2);
    });

    it("should return correct values", () => {
        const spyOnVerifier = jest
            .spyOn(Transactions.Verifier, "verifySecondSignature")
            .mockReturnValueOnce(false)
            .mockReturnValueOnce(true);

        const transaction2 = createTransaction("2");

        expect(memoizer.verifySecondSignature(transaction.data, "publicKey")).toEqual(false);
        expect(memoizer.verifySecondSignature(transaction2.data, "publicKey")).toEqual(true);

        expect(spyOnVerifier).toBeCalledTimes(2);

        // Values from cache
        expect(memoizer.verifySecondSignature(transaction.data, "publicKey")).toEqual(false);
        expect(memoizer.verifySecondSignature(transaction2.data, "publicKey")).toEqual(true);

        expect(spyOnVerifier).toBeCalledTimes(2);
    });

    it("should throw error if transaction.id is undefined", () => {
        transaction.data.id = undefined;

        expect(() => memoizer.verifySecondSignature(transaction.data, "publicKey")).toThrowError(
            "Missing transaction id",
        );
    });

    it("should remove first inserted element when max size is exceeded", () => {
        const spyOnVerifier = jest.spyOn(Transactions.Verifier, "verifySecondSignature");

        const transaction2 = createTransaction("2");
        const transaction3 = createTransaction("3");

        memoizer.verifySecondSignature(transaction.data, "publicKey");
        memoizer.verifySecondSignature(transaction2.data, "publicKey");
        memoizer.verifySecondSignature(transaction3.data, "publicKey");
        memoizer.verifySecondSignature(transaction.data, "publicKey");

        expect(spyOnVerifier).toBeCalledTimes(4);
    });
});
