import "jest-extended";

import { Utils } from "../../../../packages/crypto/src";
import { Hash } from "../../../../packages/crypto/src/crypto";
import { configManager } from "../../../../packages/crypto/src/managers";
import { Utils as TransactionUtils } from "../../../../packages/crypto/src/transactions";
import { identity } from "../../../utils/identities";

const transaction = {
    type: 0,
    amount: Utils.BigNumber.make(1000),
    fee: Utils.BigNumber.make(2000),
    recipientId: "AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff",
    timestamp: 141738,
    asset: {},
    senderPublicKey: identity.publicKey,
};

beforeEach(() => configManager.setFromPreset("devnet"));

describe("Hash", () => {
    describe("ECDSA", () => {
        it("should sign the data and verify it [String]", () => {
            const hash: Buffer = TransactionUtils.toHash(transaction);
            const signature: string = Hash.signECDSA(hash, identity.keys);

            expect(Hash.verifyECDSA(hash, signature, identity.publicKey)).toBeTrue();

            expect(signature).toEqual(
                "3044022044fee22e0c9b653320ed91bc0a1151de2c4701a55b7d2682fbdd08e028947ba4022012bb0fe6e8d1d99c9a1a494dbfae05cee219743e6a55e41199b53b351e8ae2b9",
            );
        });

        it("should sign the data and verify it [Buffer]", () => {
            const hash: Buffer = TransactionUtils.toHash(transaction);
            const signature: string = Hash.signECDSA(hash, identity.keys);

            expect(
                Hash.verifyECDSA(hash, Buffer.from(signature, "hex"), Buffer.from(identity.publicKey, "hex")),
            ).toBeTrue();

            expect(signature).toEqual(
                "3044022044fee22e0c9b653320ed91bc0a1151de2c4701a55b7d2682fbdd08e028947ba4022012bb0fe6e8d1d99c9a1a494dbfae05cee219743e6a55e41199b53b351e8ae2b9",
            );
        });
    });

    describe("schnorr", () => {
        it("should sign the data and verify it [String]", () => {
            const hash: Buffer = TransactionUtils.toHash(transaction);
            const signature: string = Hash.signSchnorr(hash, identity.keys);

            expect(Hash.verifySchnorr(hash, signature, identity.publicKey)).toBeTrue();

            expect(signature).toEqual(
                "b335d8630413fdf5f8f739d3b2d3bcc19cfdb811acf0c769cc2b2faf477c1e053b6974ccaba086fc6e1dd0cfc16bba2f18ab3d8b6624f16479886d9e4cfeb95e",
            );
        });

        it("should sign the data and verify it [Buffer]", () => {
            const hash: Buffer = TransactionUtils.toHash(transaction);
            const signature: string = Hash.signSchnorr(hash, identity.keys);

            expect(
                Hash.verifySchnorr(hash, Buffer.from(signature, "hex"), Buffer.from(identity.publicKey, "hex")),
            ).toBeTrue();

            expect(signature).toEqual(
                "b335d8630413fdf5f8f739d3b2d3bcc19cfdb811acf0c769cc2b2faf477c1e053b6974ccaba086fc6e1dd0cfc16bba2f18ab3d8b6624f16479886d9e4cfeb95e",
            );
        });
    });
});
