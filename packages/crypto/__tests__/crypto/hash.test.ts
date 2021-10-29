import "jest-extended";

import { Factories, Generators } from "@packages/core-test-framework/src";
import { TransactionFactory } from "@packages/core-test-framework/src/utils/transaction-factory";

import { Utils } from "../../../../packages/crypto/src";
import { Hash } from "../../../../packages/crypto/src/crypto";
import { configManager } from "../../../../packages/crypto/src/managers";
import { Utils as TransactionUtils } from "../../../../packages/crypto/src/transactions";

const transaction = TransactionFactory.initialize()
    .transfer("AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff", 1000)
    .withVersion(2)
    .withFee(2000)
    .withPassphrase("secret")
    .createOne();

let identity;

beforeEach(() => {
    // todo: completely wrap this into a function to hide the generation and setting of the config?
    const config = Generators.generateCryptoConfigRaw();
    configManager.setConfig(config);

    identity = Factories.factory("Identity").withOptions({ passphrase: "this is a top secret passphrase" }).make();
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

        it("should not verify when signature R or S has incorrect padding zeros", () => {
            const transactionHash: Buffer = TransactionUtils.toHash(transaction);
            const validSignature =
                "30450221008682af02d5f3c6302af14f3239a997022f69c28a5e3282603d5f25912ccd3b47022023cec266362f5bb91e6a2f2fcb62f4c61829dfd7a096432ff8b4a54a83577444";
            const invalidSignatures = [
                "3046022200008682af02d5f3c6302af14f3239a997022f69c28a5e3282603d5f25912ccd3b47022023cec266362f5bb91e6a2f2fcb62f4c61829dfd7a096432ff8b4a54a83577444",
                "30460221008682af02d5f3c6302af14f3239a997022f69c28a5e3282603d5f25912ccd3b4702210023cec266362f5bb91e6a2f2fcb62f4c61829dfd7a096432ff8b4a54a83577444",
                "304702230000008682af02d5f3c6302af14f3239a997022f69c28a5e3282603d5f25912ccd3b47022023cec266362f5bb91e6a2f2fcb62f4c61829dfd7a096432ff8b4a54a83577444",
                "30460221008682af02d5f3c6302af14f3239a997022f69c28a5e3282603d5f25912ccd3b470222000023cec266362f5bb91e6a2f2fcb62f4c61829dfd7a096432ff8b4a54a83577444",
            ];

            expect(
                Hash.verifyECDSA(transactionHash, validSignature, Buffer.from(identity.publicKey, "hex")),
            ).toBeTrue();

            for (const invalidSignature of invalidSignatures) {
                expect(
                    Hash.verifyECDSA(transactionHash, invalidSignature, Buffer.from(identity.publicKey, "hex")),
                ).toBeFalse();
            }

            // also check specific case where s length is 31 bytes (because s is low enough to not need 32 bytes)
            const data = {
                id: "e215334a97c13d80156bed8f889ed27970203bef9d932afff6cdc9fe2a62530d",
                version: 2,
                type: 0,
                typeGroup: 1,
                amount: Utils.BigNumber.make("10000000"),
                fee: Utils.BigNumber.make("10000000"),
                senderPublicKey: "025153dba3247208ed8f5e2616cd956401bed2906d6f94fb44d87ab5d05e06d4e3",
                recipientId: "Aa8NVJUW6tnbdoYYRmwYgV5TdFXhDvAJXA",
                timestamp: 93745400,
                nonce: Utils.BigNumber.make("53"),
                network: 23,
            };
            const signature =
                "304402202377db2bc936f600516aca95aed631d2ab6971be1be4d449989d9ed7457356e20220002dbdea52266d03839468eaad90ad9ca13e823d35e29291842e49f4555c33c1";
            const signatureNotPadded =
                "304302202377db2bc936f600516aca95aed631d2ab6971be1be4d449989d9ed7457356e2021f2dbdea52266d03839468eaad90ad9ca13e823d35e29291842e49f4555c33c1";
            const hash: Buffer = TransactionUtils.toHash(data);

            expect(Hash.verifyECDSA(hash, signatureNotPadded, Buffer.from(data.senderPublicKey, "hex"))).toBeTrue();
            expect(Hash.verifyECDSA(hash, signature, Buffer.from(data.senderPublicKey, "hex"))).toBeFalse();
        });

        it("should not verify with a wrong signature length value", () => {
            const hash: Buffer = TransactionUtils.toHash(transaction);
            const validSignature =
                "30450221008682af02d5f3c6302af14f3239a997022f69c28a5e3282603d5f25912ccd3b47022023cec266362f5bb91e6a2f2fcb62f4c61829dfd7a096432ff8b4a54a83577444";
            const invalidSignatures = [
                "30440221008682af02d5f3c6302af14f3239a997022f69c28a5e3282603d5f25912ccd3b47022023cec266362f5bb91e6a2f2fcb62f4c61829dfd7a096432ff8b4a54a83577444",
                "30430221008682af02d5f3c6302af14f3239a997022f69c28a5e3282603d5f25912ccd3b47022023cec266362f5bb91e6a2f2fcb62f4c61829dfd7a096432ff8b4a54a83577444",
                "30460221008682af02d5f3c6302af14f3239a997022f69c28a5e3282603d5f25912ccd3b47022023cec266362f5bb91e6a2f2fcb62f4c61829dfd7a096432ff8b4a54a83577444",
            ];

            expect(Hash.verifyECDSA(hash, validSignature, Buffer.from(identity.publicKey, "hex"))).toBeTrue();

            for (const invalidSignature of invalidSignatures) {
                expect(Hash.verifyECDSA(hash, invalidSignature, Buffer.from(identity.publicKey, "hex"))).toBeFalse();
            }
        });

        it("should not verify with a wrong header byte", () => {
            const hash: Buffer = TransactionUtils.toHash(transaction);
            const validSignature =
                "30450221008682af02d5f3c6302af14f3239a997022f69c28a5e3282603d5f25912ccd3b47022023cec266362f5bb91e6a2f2fcb62f4c61829dfd7a096432ff8b4a54a83577444";
            const invalidSignatures = [
                "20450221008682af02d5f3c6302af14f3239a997022f69c28a5e3282603d5f25912ccd3b47022023cec266362f5bb91e6a2f2fcb62f4c61829dfd7a096432ff8b4a54a83577444",
                "31450221008682af02d5f3c6302af14f3239a997022f69c28a5e3282603d5f25912ccd3b47022023cec266362f5bb91e6a2f2fcb62f4c61829dfd7a096432ff8b4a54a83577444",
                "40450221008682af02d5f3c6302af14f3239a997022f69c28a5e3282603d5f25912ccd3b47022023cec266362f5bb91e6a2f2fcb62f4c61829dfd7a096432ff8b4a54a83577444",
            ];

            expect(Hash.verifyECDSA(hash, validSignature, Buffer.from(identity.publicKey, "hex"))).toBeTrue();

            for (const invalidSignature of invalidSignatures) {
                expect(() =>
                    Hash.verifyECDSA(hash, invalidSignature, Buffer.from(identity.publicKey, "hex")),
                ).toThrow();
            }
        });

        it("should not verify with a wrong integer marker", () => {
            const hash: Buffer = TransactionUtils.toHash(transaction);
            const validSignature =
                "30450221008682af02d5f3c6302af14f3239a997022f69c28a5e3282603d5f25912ccd3b47022023cec266362f5bb91e6a2f2fcb62f4c61829dfd7a096432ff8b4a54a83577444";
            const invalidSignatures = [
                "30450121008682af02d5f3c6302af14f3239a997022f69c28a5e3282603d5f25912ccd3b47022023cec266362f5bb91e6a2f2fcb62f4c61829dfd7a096432ff8b4a54a83577444",
                "30450221008682af02d5f3c6302af14f3239a997022f69c28a5e3282603d5f25912ccd3b47012023cec266362f5bb91e6a2f2fcb62f4c61829dfd7a096432ff8b4a54a83577444",
                "30450221008682af02d5f3c6302af14f3239a997022f69c28a5e3282603d5f25912ccd3b47032023cec266362f5bb91e6a2f2fcb62f4c61829dfd7a096432ff8b4a54a83577444",
            ];

            expect(Hash.verifyECDSA(hash, validSignature, Buffer.from(identity.publicKey, "hex"))).toBeTrue();

            for (const invalidSignature of invalidSignatures) {
                expect(() =>
                    Hash.verifyECDSA(hash, invalidSignature, Buffer.from(identity.publicKey, "hex")),
                ).toThrow();
            }
        });

        it("should not verify with a wrong R or S length", () => {
            const hash: Buffer = TransactionUtils.toHash(transaction);
            const validSignature =
                "30450221008682af02d5f3c6302af14f3239a997022f69c28a5e3282603d5f25912ccd3b47022023cec266362f5bb91e6a2f2fcb62f4c61829dfd7a096432ff8b4a54a83577444";
            const invalidSignatures = [
                "30450220008682af02d5f3c6302af14f3239a997022f69c28a5e3282603d5f25912ccd3b47022023cec266362f5bb91e6a2f2fcb62f4c61829dfd7a096432ff8b4a54a83577444",
                "30450221008682af02d5f3c6302af14f3239a997022f69c28a5e3282603d5f25912ccd3b47022123cec266362f5bb91e6a2f2fcb62f4c61829dfd7a096432ff8b4a54a83577444",
                "30450222008682af02d5f3c6302af14f3239a997022f69c28a5e3282603d5f25912ccd3b47022023cec266362f5bb91e6a2f2fcb62f4c61829dfd7a096432ff8b4a54a83577444",
            ];

            expect(Hash.verifyECDSA(hash, validSignature, Buffer.from(identity.publicKey, "hex"))).toBeTrue();

            for (const invalidSignature of invalidSignatures) {
                expect(() =>
                    Hash.verifyECDSA(hash, invalidSignature, Buffer.from(identity.publicKey, "hex")),
                ).toThrow();
            }
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
