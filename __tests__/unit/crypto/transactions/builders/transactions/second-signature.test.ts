import "jest-extended";

import { configManager } from "../../../../../../packages/crypto/src/managers";

configManager.setFromPreset("testnet");

import { Utils } from "@arkecosystem/crypto";
import { TransactionType } from "../../../../../../packages/crypto/src/enums";
import { Keys } from "../../../../../../packages/crypto/src/identities";
import {
    BuilderFactory,
    SecondSignatureRegistrationTransaction,
} from "../../../../../../packages/crypto/src/transactions";
import { SecondSignatureBuilder } from "../../../../../../packages/crypto/src/transactions/builders/transactions/second-signature";
import { identity } from "../../../../../utils/identities";
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
        expect(builder).toHaveProperty("data.type", TransactionType.SecondSignature);
        expect(builder).toHaveProperty("data.fee", SecondSignatureRegistrationTransaction.staticFee());
        expect(builder).toHaveProperty("data.amount", Utils.BigNumber.make(0));
        expect(builder).toHaveProperty("data.recipientId", undefined);
        expect(builder).toHaveProperty("data.senderPublicKey", undefined);
        expect(builder).toHaveProperty("data.asset");
        expect(builder).toHaveProperty("data.asset.signature", {});
    });

    describe("signatureAsset", () => {
        it("establishes the signature on the asset", () => {
            jest.spyOn(Keys, "fromWIF").mockReturnValueOnce(identity.keys);

            builder.signatureAsset(identity.bip39);

            expect(builder.data.asset.signature.publicKey).toBe(identity.publicKey);
        });
    });
});
