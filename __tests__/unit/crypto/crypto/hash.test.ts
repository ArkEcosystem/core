import "jest-extended";

import { CryptoManager } from "@packages/crypto/src";

import { identity } from "../fixtures/identities";

let Hash;
let transactionHash;

beforeEach(() => {
    const crypto = CryptoManager.createFromPreset("testnet");
    Hash = crypto.libraryManager.Crypto.Hash;
    const hex = "27f68f1e62b9e6e3bc13b7113488f1e27263a4e47e7d9c7acd9c9af67d7fa11c";
    transactionHash = Buffer.from(hex, "hex");
});

describe("Hash", () => {
    describe("ECDSA", () => {
        it("should sign the data and verify it [String]", () => {
            const signature: string = Hash.signECDSA(transactionHash, identity.keys);

            expect(Hash.verifyECDSA(transactionHash, signature, identity.publicKey)).toBeTrue();

            expect(signature).toEqual(
                "30450221008682af02d5f3c6302af14f3239a997022f69c28a5e3282603d5f25912ccd3b47022023cec266362f5bb91e6a2f2fcb62f4c61829dfd7a096432ff8b4a54a83577444",
            );
        });

        it("should sign the data and verify it [Buffer]", () => {
            const signature: string = Hash.signECDSA(transactionHash, identity.keys);

            expect(
                Hash.verifyECDSA(
                    transactionHash,
                    Buffer.from(signature, "hex"),
                    Buffer.from(identity.publicKey, "hex"),
                ),
            ).toBeTrue();

            expect(signature).toEqual(
                "30450221008682af02d5f3c6302af14f3239a997022f69c28a5e3282603d5f25912ccd3b47022023cec266362f5bb91e6a2f2fcb62f4c61829dfd7a096432ff8b4a54a83577444",
            );
        });
    });

    describe("schnorr", () => {
        it("should sign the data and verify it [String]", () => {
            const signature: string = Hash.signSchnorr(transactionHash, identity.keys);

            expect(Hash.verifySchnorr(transactionHash, signature, identity.publicKey)).toBeTrue();

            expect(signature).toEqual(
                "dd78ce399058357fc3ca881d38e54efc1b6841719106aa55fb186186fa0f3330bc37c8cb2bd8e48d272f1f9532df89a6b5f69945c56d05947bd3186e872db99a",
            );
        });

        it("should sign the data and verify it [Buffer]", () => {
            const signature: string = Hash.signSchnorr(transactionHash, identity.keys);

            expect(
                Hash.verifySchnorr(
                    transactionHash,
                    Buffer.from(signature, "hex"),
                    Buffer.from(identity.publicKey, "hex"),
                ),
            ).toBeTrue();

            expect(signature).toEqual(
                "dd78ce399058357fc3ca881d38e54efc1b6841719106aa55fb186186fa0f3330bc37c8cb2bd8e48d272f1f9532df89a6b5f69945c56d05947bd3186e872db99a",
            );
        });
    });
});
