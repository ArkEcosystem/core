import "jest-extended";

import { Hash } from "../../../../packages/crypto/src/crypto";
import { configManager } from "../../../../packages/crypto/src/managers";
import { Utils as TransactionUtils } from "../../../../packages/crypto/src/transactions";
import { TransactionFactory } from "../../../helpers/transaction-factory";
import { identity } from "../../../utils/identities";

const transaction = TransactionFactory.transfer("AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff", 1000)
    .withVersion(2)
    .withFee(2000)
    .withPassphrase("secret")
    .createOne();

beforeEach(() => {
    configManager.setFromPreset("testnet");
    configManager.setHeight(2); // aip11 (v2 transactions) is true from height 2 on testnet
});

describe("Hash", () => {
    describe("ECDSA", () => {
        it("should sign the data and verify it [String]", () => {
            const hash: Buffer = TransactionUtils.toHash(transaction);
            const signature: string = Hash.signECDSA(hash, identity.keys);

            expect(Hash.verifyECDSA(hash, signature, identity.publicKey)).toBeTrue();

            expect(signature).toEqual(
                "30450221008682af02d5f3c6302af14f3239a997022f69c28a5e3282603d5f25912ccd3b47022023cec266362f5bb91e6a2f2fcb62f4c61829dfd7a096432ff8b4a54a83577444",
            );
        });

        it("should sign the data and verify it [Buffer]", () => {
            const hash: Buffer = TransactionUtils.toHash(transaction);
            const signature: string = Hash.signECDSA(hash, identity.keys);

            expect(
                Hash.verifyECDSA(hash, Buffer.from(signature, "hex"), Buffer.from(identity.publicKey, "hex")),
            ).toBeTrue();

            expect(signature).toEqual(
                "30450221008682af02d5f3c6302af14f3239a997022f69c28a5e3282603d5f25912ccd3b47022023cec266362f5bb91e6a2f2fcb62f4c61829dfd7a096432ff8b4a54a83577444",
            );
        });

        it("should not verify when signature length does not match R and S length", () => {
            const hash: Buffer = TransactionUtils.toHash(transaction);
            const validSignature =
                "30450221008682af02d5f3c6302af14f3239a997022f69c28a5e3282603d5f25912ccd3b47022023cec266362f5bb91e6a2f2fcb62f4c61829dfd7a096432ff8b4a54a83577444";
            const invalidSignature =
                "30460221008682af02d5f3c6302af14f3239a997022f69c28a5e3282603d5f25912ccd3b47022023cec266362f5bb91e6a2f2fcb62f4c61829dfd7a096432ff8b4a54a8357744400";

            expect(Hash.verifyECDSA(hash, validSignature, Buffer.from(identity.publicKey, "hex"))).toBeTrue();
            expect(Hash.verifyECDSA(hash, invalidSignature, Buffer.from(identity.publicKey, "hex"))).toBeFalse();
        });

        it("should not verify when signature R or S is negative", () => {
            const hash: Buffer = TransactionUtils.toHash(transaction);
            const validSignature =
                "30450221008682af02d5f3c6302af14f3239a997022f69c28a5e3282603d5f25912ccd3b47022023cec266362f5bb91e6a2f2fcb62f4c61829dfd7a096432ff8b4a54a83577444";
            const invalidSignatureNegativeR =
                "304402208682af02d5f3c6302af14f3239a997022f69c28a5e3282603d5f25912ccd3b47022023cec266362f5bb91e6a2f2fcb62f4c61829dfd7a096432ff8b4a54a83577444";

            expect(Hash.verifyECDSA(hash, validSignature, Buffer.from(identity.publicKey, "hex"))).toBeTrue();
            expect(
                Hash.verifyECDSA(hash, invalidSignatureNegativeR, Buffer.from(identity.publicKey, "hex")),
            ).toBeFalse();
        });
    });

    describe("schnorr", () => {
        it("should sign the data and verify it [String]", () => {
            const hash: Buffer = TransactionUtils.toHash(transaction);
            const signature: string = Hash.signSchnorr(hash, identity.keys);

            expect(Hash.verifySchnorr(hash, signature, identity.publicKey)).toBeTrue();

            expect(signature).toEqual(
                "dd78ce399058357fc3ca881d38e54efc1b6841719106aa55fb186186fa0f3330bc37c8cb2bd8e48d272f1f9532df89a6b5f69945c56d05947bd3186e872db99a",
            );
        });

        it("should sign the data and verify it [Buffer]", () => {
            const hash: Buffer = TransactionUtils.toHash(transaction);
            const signature: string = Hash.signSchnorr(hash, identity.keys);

            expect(
                Hash.verifySchnorr(hash, Buffer.from(signature, "hex"), Buffer.from(identity.publicKey, "hex")),
            ).toBeTrue();

            expect(signature).toEqual(
                "dd78ce399058357fc3ca881d38e54efc1b6841719106aa55fb186186fa0f3330bc37c8cb2bd8e48d272f1f9532df89a6b5f69945c56d05947bd3186e872db99a",
            );
        });
    });
});
