import "jest-extended";

import { Utils } from "@packages/crypto";
import { Factories, Generators } from "@packages/core-test-framework/src";
import { TransactionType } from "@packages/crypto/src/enums";
import { Keys } from "@packages/crypto/src/identities";
import { configManager } from "@packages/crypto/src/managers";
import { BuilderFactory } from "@packages/crypto/src/transactions";
import { SecondSignatureBuilder } from "@packages/crypto/src/transactions/builders/transactions/second-signature";
import { Two } from "@packages/crypto/src/transactions/types";

let builder: SecondSignatureBuilder;
let identity;

beforeAll(() => {
    // todo: completely wrap this into a function to hide the generation and setting of the config?
    const config = Generators.generateCryptoConfigRaw();
    configManager.setConfig(config);

    identity = Factories.factory("Identity")
        .withOptions({ passphrase: "this is a top secret passphrase", network: config.network })
        .make();
});

beforeEach(() => (builder = BuilderFactory.secondSignature()));

describe("Second Signature Transaction", () => {
    describe("verify", () => {
        it("should be valid with a signature", () => {
            const actual = builder.signatureAsset("signature").sign("dummy passphrase");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });
    });

    it("should have its specific properties", () => {
        expect(builder).toHaveProperty("data.type", TransactionType.SecondSignature);
        expect(builder).toHaveProperty("data.fee", Two.SecondSignatureRegistrationTransaction.staticFee());
        expect(builder).toHaveProperty("data.amount", Utils.BigNumber.make(0));
        expect(builder).toHaveProperty("data.recipientId", undefined);
        expect(builder).toHaveProperty("data.senderPublicKey", undefined);
        expect(builder).toHaveProperty("data.asset");
        expect(builder).toHaveProperty("data.asset.signature", {});
    });

    describe("signatureAsset", () => {
        it("establishes the signature on the asset", () => {
            jest.spyOn(Keys, "fromPassphrase").mockReturnValueOnce(identity.keys);

            builder.signatureAsset(identity.bip39);

            expect(builder.data.asset.signature.publicKey).toBe(identity.publicKey);
        });
    });
});
