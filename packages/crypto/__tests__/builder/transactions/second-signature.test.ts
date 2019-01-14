import "jest-extended";
import { SecondSignatureBuilder } from "../../../dist/builder";
import { client as ark } from "../../../dist/client";
import { TransactionTypes } from "../../../dist/constants";
import { crypto } from "../../../dist/crypto/crypto";
import { feeManager } from "../../../dist/managers/fee";
import { transactionBuilder } from "./__shared__/transaction-builder";

let builder : SecondSignatureBuilder;

beforeEach(() => {
    builder = ark.getBuilder().secondSignature();
});

describe("Second Signature Transaction", () => {
    describe("verify", () => {
        it("should be valid with a signature", () => {
            const actual = builder.signatureAsset("signature").sign("dummy passphrase");

            expect(actual.build().verify()).toBeTrue();
        });
    });

    transactionBuilder(() => builder);

    it("should have its specific properties", () => {
        expect(builder).toHaveProperty("data.type", TransactionTypes.SecondSignature);
        expect(builder).toHaveProperty("data.fee", feeManager.get(TransactionTypes.SecondSignature));
        expect(builder).toHaveProperty("data.amount", 0);
        expect(builder).toHaveProperty("data.recipientId", null);
        expect(builder).toHaveProperty("data.senderPublicKey", null);
        expect(builder).toHaveProperty("data.asset");
        expect(builder).toHaveProperty("data.asset.signature", {});
    });

    describe("signatureAsset", () => {
        it("establishes the signature on the asset", () => {
            crypto.getKeys = jest.fn(pass => ({ publicKey: `${pass} public key` }));
            crypto.sign = jest.fn();

            builder.signatureAsset("bad pass");

            expect(builder.data.asset.signature.publicKey).toBe("bad pass public key");
        });
    });
});
