import "jest-extended";

import { configManager } from "../../../../../../packages/crypto/src/managers";

configManager.setFromPreset("testnet");

import { TransactionTypes } from "../../../../../../packages/crypto/src/enums";
import { TransactionVersionError } from "../../../../../../packages/crypto/src/errors";
import {
    BuilderFactory,
    MultiSignatureRegistrationTransaction,
} from "../../../../../../packages/crypto/src/transactions";
import { MultiSignatureBuilder } from "../../../../../../packages/crypto/src/transactions/builders/transactions/multi-signature";
import * as Utils from "../../../../../../packages/crypto/src/utils";
import { transactionBuilder } from "./__shared__/transaction-builder";

let builder: MultiSignatureBuilder;

beforeEach(() => {
    builder = BuilderFactory.multiSignature();
});

describe("Multi Signature Transaction", () => {
    describe("verify", () => {
        it("should be valid with a signature", () => {
            const actual = builder
                .multiSignatureAsset({
                    publicKeys: [
                        "039180ea4a8a803ee11ecb462bb8f9613fcdb5fe917e292dbcc73409f0e98f8f22",
                        "028d3611c4f32feca3e6713992ae9387e18a0e01954046511878fe078703324dc0",
                        "021d3932ab673230486d0f956d05b9e88791ee298d9af2d6df7d9ed5bb861c92dd",
                    ],
                    min: 2,
                })
                .senderPublicKey("039180ea4a8a803ee11ecb462bb8f9613fcdb5fe917e292dbcc73409f0e98f8f22")
                .multiSign("secret 1", 0)
                .multiSign("secret 2", 1)
                .multiSign("secret 3", 2)
                .sign("secret 1");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });

        it("should be invalid when aip11 is not active", () => {
            configManager.getMilestone().aip11 = false;
            const actual = builder
                .multiSignatureAsset({
                    publicKeys: [
                        "039180ea4a8a803ee11ecb462bb8f9613fcdb5fe917e292dbcc73409f0e98f8f22",
                        "028d3611c4f32feca3e6713992ae9387e18a0e01954046511878fe078703324dc0",
                        "021d3932ab673230486d0f956d05b9e88791ee298d9af2d6df7d9ed5bb861c92dd",
                    ],
                    min: 2,
                })
                .senderPublicKey("039180ea4a8a803ee11ecb462bb8f9613fcdb5fe917e292dbcc73409f0e98f8f22");

            expect(() => actual.multiSign("secret 1", 0)).toThrowError(TransactionVersionError);
            configManager.getMilestone().aip11 = true;
        });
    });

    transactionBuilder(() => builder);

    it("should have its specific properties", () => {
        expect(builder).toHaveProperty("data.type", TransactionTypes.MultiSignature);
        expect(builder).toHaveProperty("data.version", 0x02);
        expect(builder).toHaveProperty("data.fee", Utils.BigNumber.make(0));
        expect(builder).toHaveProperty("data.amount", Utils.BigNumber.make(0));
        expect(builder).toHaveProperty("data.recipientId", undefined);
        expect(builder).toHaveProperty("data.senderPublicKey", undefined);
        expect(builder).toHaveProperty("data.asset");
        expect(builder).toHaveProperty("data.asset.multiSignature", { min: 0, publicKeys: [] });
    });

    describe("multiSignatureAsset", () => {
        const multiSignatureFee = MultiSignatureRegistrationTransaction.staticFee();
        const multiSignature = {
            publicKeys: ["key a", "key b", "key c"],
            min: 1,
        };

        it("establishes the multi-signature on the asset", () => {
            builder.multiSignatureAsset(multiSignature);
            expect(builder.data.asset.multiSignature).toBe(multiSignature);
        });

        it("calculates and establish the fee", () => {
            builder.multiSignatureAsset(multiSignature);
            expect(builder.data.fee).toEqual(Utils.BigNumber.make(4).times(multiSignatureFee));
        });
    });

    describe("multiSign", () => {
        it("adds the signature to the transaction", () => {
            const actual = builder
                .multiSignatureAsset({
                    publicKeys: [
                        "039180ea4a8a803ee11ecb462bb8f9613fcdb5fe917e292dbcc73409f0e98f8f22",
                        "028d3611c4f32feca3e6713992ae9387e18a0e01954046511878fe078703324dc0",
                        "021d3932ab673230486d0f956d05b9e88791ee298d9af2d6df7d9ed5bb861c92dd",
                    ],
                    min: 2,
                })
                .senderPublicKey("039180ea4a8a803ee11ecb462bb8f9613fcdb5fe917e292dbcc73409f0e98f8f22")
                .nonce("1");

            actual
                .multiSign("secret 1", 0)
                .multiSign("secret 2", 1)
                .multiSign("secret 3", 2);

            expect(actual.data.signatures).toEqual([
                "003c736a01ad8a240c41cf9e9f6b863b21c3514c49068d93105ee5d00083e0d66bf333ab2fcda5b90fffa8969ccb2fe1233a29eca31a90f9d809e33dec169c7698",
                "0112d150d02cbdf29309dd578683659d6a90666aaff950a4a4c2837815727d4b3d1eaaab24f4f1e6e57b845ff7b74b37eecd72dc85829a6652ccddf26b4c9e4a39",
                "0211b1c08bc30ef7aed19c61ec36bddedf336bb58935789a89430eb15028226ee3cc93db436a7896f3315d8da94f4d2d1b1cc6c1a03934b7c60502c33add0d0a7a",
            ]);
            expect(actual.data.signatures.length).toBe(3);
        });
    });
});
