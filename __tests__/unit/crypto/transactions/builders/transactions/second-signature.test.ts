import "jest-extended";

import { Utils } from "@arkecosystem/crypto";
import { crypto } from "../../../../../../packages/crypto/src/crypto/crypto";
import { TransactionTypes } from "../../../../../../packages/crypto/src/enums";
import { feeManager } from "../../../../../../packages/crypto/src/managers/fee";
import { BuilderFactory } from "../../../../../../packages/crypto/src/transactions";
import { SecondSignatureBuilder } from "../../../../../../packages/crypto/src/transactions/builders/transactions/second-signature";
import { transactionBuilder } from "./__shared__/transaction-builder";

let builder: SecondSignatureBuilder;

beforeEach(() => {
    builder = BuilderFactory.secondSignature();
});

describe("Second Signature Transaction", () => {
    describe("verify", () => {
        it("should be valid with a signature", () => {
            const actual = builder.signatureAsset("signature").sign("dummy passphrase");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });
    });

    transactionBuilder(() => builder);

    it("should have its specific properties", () => {
        expect(builder).toHaveProperty("data.type", TransactionTypes.SecondSignature);
        expect(builder).toHaveProperty("data.fee", feeManager.get(TransactionTypes.SecondSignature));
        expect(builder).toHaveProperty("data.amount", Utils.BigNumber.make(0));
        expect(builder).toHaveProperty("data.recipientId", null);
        expect(builder).toHaveProperty("data.senderPublicKey", null);
        expect(builder).toHaveProperty("data.asset");
        expect(builder).toHaveProperty("data.asset.signature", {});
    });

    describe("signatureAsset", () => {
        it("establishes the signature on the asset", () => {
            // @ts-ignore
            crypto.getKeys = jest.fn(pass => ({ publicKey: `${pass} public key` }));
            crypto.sign = jest.fn();

            builder.signatureAsset("bad pass");

            expect(builder.data.asset.signature.publicKey).toBe("bad pass public key");
        });
    });
});
