import "jest-extended";

import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import { MultiSignatureVerificationMemoizer } from "@packages/core-transactions/src/memoizers/multi-signature-verification";
import { Identities, Interfaces, Transactions } from "@packages/crypto";
import { BuilderFactory } from "@packages/crypto/dist/transactions";
import { Application, Container, Providers } from "@packages/core-kernel";

describe("MultiSignatureVerificationMemoizer", () => {
    let transaction: Interfaces.ITransaction;
    let multiSignatureAsset: Interfaces.IMultiSignatureAsset;

    let app: Application;
    let memoizer: MultiSignatureVerificationMemoizer;

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

        memoizer = app.resolve(MultiSignatureVerificationMemoizer);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should call verifier if no cached value is found", () => {
        const spyOnVerifier = jest.spyOn(Transactions.Verifier, "verifySignatures");

        memoizer.verifySignatures(transaction.data, multiSignatureAsset);

        expect(spyOnVerifier).toBeCalled();
    });

    it("should take cached value if called with same parameters", () => {
        const spyOnVerifier = jest.spyOn(Transactions.Verifier, "verifySignatures");

        const result1 = memoizer.verifySignatures(transaction.data, multiSignatureAsset);
        const result2 = memoizer.verifySignatures(transaction.data, multiSignatureAsset);

        expect(spyOnVerifier).toBeCalledTimes(1);
        expect(result1).toEqual(result2);
    });

    it("should not take cached value if called with different parameters", () => {
        const spyOnVerifier = jest.spyOn(Transactions.Verifier, "verifySignatures");

        memoizer.verifySignatures(transaction.data, multiSignatureAsset);
        memoizer.verifySignatures(transaction.data, { ...multiSignatureAsset, min: 3 });

        expect(spyOnVerifier).toBeCalledTimes(2);
    });

    it("should return correct values", () => {
        const spyOnVerifier = jest
            .spyOn(Transactions.Verifier, "verifySignatures")
            .mockReturnValueOnce(false)
            .mockReturnValueOnce(true);

        const transaction2 = createTransaction("2");

        expect(memoizer.verifySignatures(transaction.data, multiSignatureAsset)).toEqual(false);
        expect(memoizer.verifySignatures(transaction2.data, multiSignatureAsset)).toEqual(true);

        expect(spyOnVerifier).toBeCalledTimes(2);

        // Values from cache
        expect(memoizer.verifySignatures(transaction.data, multiSignatureAsset)).toEqual(false);
        expect(memoizer.verifySignatures(transaction2.data, multiSignatureAsset)).toEqual(true);

        expect(spyOnVerifier).toBeCalledTimes(2);
    });

    it("should throw error if transaction.id is undefined", () => {
        transaction.data.id = undefined;

        expect(() => memoizer.verifySignatures(transaction.data, multiSignatureAsset)).toThrowError(
            "Missing transaction id",
        );
    });

    it("should remove first inserted element when max size is exceeded", () => {
        const spyOnVerifier = jest.spyOn(Transactions.Verifier, "verifySignatures");

        const transaction2 = createTransaction("2");
        const transaction3 = createTransaction("3");

        memoizer.verifySignatures(transaction.data, multiSignatureAsset);
        memoizer.verifySignatures(transaction2.data, multiSignatureAsset);
        memoizer.verifySignatures(transaction3.data, multiSignatureAsset);
        memoizer.verifySignatures(transaction.data, multiSignatureAsset);

        expect(spyOnVerifier).toBeCalledTimes(4);
    });
});
