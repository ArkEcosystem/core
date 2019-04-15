import { crypto } from "../../../../../../packages/crypto/src/crypto";
import { TransactionTypes } from "../../../../../../packages/crypto/src/enums";
import { feeManager } from "../../../../../../packages/crypto/src/managers/fee";
import { BuilderFactory } from "../../../../../../packages/crypto/src/transactions";
import { MultiSignatureBuilder } from "../../../../../../packages/crypto/src/transactions/builders/transactions/multi-signature";
import * as Utils from "../../../../../../packages/crypto/src/utils";
import { transactionBuilder } from "./__shared__/transaction-builder";

let builder: MultiSignatureBuilder;

beforeEach(() => {
    builder = BuilderFactory.multiSignature();
});

describe("Multi Signature Transaction", () => {
    describe("verify", () => {
        it.skip("should be valid with a signature", () => {
            const actual = builder
                .multiSignatureAsset({
                    keysgroup: [
                        "+0376982a97dadbc65e694743d386084548a65431a82ce935ac9d957b1cffab2784",
                        "+03793904e0df839809bc89f2839e1ae4f8b1ea97ede6592b7d1e4d0ee194ca2998",
                        "+03e710267cdbc87cf8c2f32a6c3f22e1d1ce22ba30e1915360f511a2b16df8c5a5",
                    ],
                    lifetime: 72,
                    min: 2,
                })
                .sign("dummy passphrase")
                .multiSignatureSign("multi passphrase 1")
                .multiSignatureSign("multi passphrase 2")
                .multiSignatureSign("multi passphrase 3");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });
    });

    transactionBuilder(() => builder);

    it("should have its specific properties", () => {
        expect(builder).toHaveProperty("data.type", TransactionTypes.MultiSignature);
        expect(builder).toHaveProperty("data.fee", Utils.BigNumber.make(0));
        expect(builder).toHaveProperty("data.amount", Utils.BigNumber.make(0));
        expect(builder).toHaveProperty("data.recipientId", null);
        expect(builder).toHaveProperty("data.senderPublicKey", null);
        expect(builder).toHaveProperty("data.asset");
        expect(builder).toHaveProperty("data.asset.multisignature", {});
    });

    describe("multiSignatureAsset", () => {
        const multiSignatureFee = feeManager.get(TransactionTypes.MultiSignature);
        const multisignature = {
            keysgroup: ["key a", "key b", "key c"],
            lifetime: 1,
            min: 1,
        };

        it("establishes the multi-signature on the asset", () => {
            builder.multiSignatureAsset(multisignature);
            expect(builder.data.asset.multisignature).toBe(multisignature);
        });

        it("calculates and establish the fee", () => {
            builder.multiSignatureAsset(multisignature);
            expect(builder.data.fee).toEqual(Utils.BigNumber.make(4).times(multiSignatureFee));
        });
    });

    describe("sign", () => {
        it("establishes the recipient id", () => {
            const pass = "dummy pass";

            // @ts-ignore
            crypto.getKeys = jest.fn(() => ({
                publicKey: "02d0d835266297f15c192be2636eb3fbc30b39b87fc583ff112062ef8ae1a1f2af",
            }));
            crypto.sign = jest.fn();

            builder.sign(pass);
            expect(builder.data.recipientId).toBe("D5q7YfEFDky1JJVQQEy4MGyiUhr5cGg47F");
        });
    });

    describe("multiSignatureSign", () => {
        it("adds the signature to the transaction", () => {
            const pass = "dummy pass";
            const signature = `${pass} signature`;

            // @ts-ignore
            crypto.getKeys = jest.fn(value => ({ publicKey: `${value} public key` }));
            crypto.sign = jest.fn(() => signature);

            builder.multiSignatureSign(pass);
            expect(builder.data.signatures).toIncludeAllMembers([signature]);
        });
    });
});
