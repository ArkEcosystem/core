import "jest-extended";

import { CryptoManager, Interfaces, Transactions } from "@arkecosystem/crypto/src";
import * as Generators from "@packages/core-test-framework/src/app/generators";
import { TransactionType } from "@packages/crypto/src/enums";
import { SecondSignatureBuilder } from "@packages/crypto/src/transactions/builders/transactions/second-signature";
import { Two } from "@packages/crypto/src/transactions/types";

import { constructIdentity } from "../../__support__/identitity";

let crypto: CryptoManager<any>;
let builder: SecondSignatureBuilder<any, Interfaces.ITransactionData, any>;
let transactionsManager: Transactions.TransactionsManager<any, Interfaces.ITransactionData, any>;
let identity;

beforeEach(() => {
    crypto = CryptoManager.createFromConfig(Generators.generateCryptoConfigRaw());

    transactionsManager = new Transactions.TransactionsManager(crypto, {
        extendTransaction: () => {},
        // @ts-ignore
        validate: (_, data) => ({
            value: data,
        }),
    });

    builder = transactionsManager.BuilderFactory.secondSignature();

    identity = constructIdentity("this is a top secret passphrase", crypto);
});

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
        expect(builder).toHaveProperty("data.fee", Two.SecondSignatureRegistrationTransaction.staticFee(crypto));
        expect(builder).toHaveProperty("data.amount", crypto.LibraryManager.Libraries.BigNumber.make(0));
        expect(builder).toHaveProperty("data.recipientId", undefined);
        expect(builder).toHaveProperty("data.senderPublicKey", undefined);
        expect(builder).toHaveProperty("data.asset");
        expect(builder).toHaveProperty("data.asset.signature", {});
    });

    describe("signatureAsset", () => {
        it("establishes the signature on the asset", () => {
            jest.spyOn(crypto.Identities.Keys, "fromPassphrase").mockReturnValueOnce(identity.keys);

            builder.signatureAsset(identity.bip39);

            expect(builder.data.asset.signature.publicKey).toBe(identity.publicKey);
        });
    });
});
