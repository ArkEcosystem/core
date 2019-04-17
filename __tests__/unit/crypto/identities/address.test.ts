import "jest-extended";

import { PublicKey } from "@arkecosystem/crypto/src/identities";
import { InvalidMultiSignatureAssetError, PublicKeyError } from "../../../../packages/crypto/src/errors";
import { Address } from "../../../../packages/crypto/src/identities/address";
import { Keys } from "../../../../packages/crypto/src/identities/keys";
import { data, passphrase } from "./fixture.json";

describe("Identities - Address", () => {
    describe("fromPassphrase", () => {
        it("should be OK", () => {
            expect(Address.fromPassphrase(passphrase)).toBe(data.address);
        });
    });

    describe("fromPublicKey", () => {
        it("should pass with a valid public key", () => {
            expect(Address.fromPublicKey(data.publicKey)).toBe(data.address);
        });

        it("should fail with an invalid public key", () => {
            expect(() => {
                Address.fromPublicKey("invalid");
            }).toThrow(PublicKeyError);
        });
    });

    describe("fromMultiSignatureAddress", () => {
        it("should be ok", () => {
            expect(
                Address.fromMultiSignatureAsset({
                    min: 3,
                    publicKeys: ["secret 1", "secret 2", "secret 3"].map(secret => PublicKey.fromPassphrase(secret)),
                }),
            ).toBe("DJsEH5mxveqEtNBtjs6CSFzYmsJHHwUMXy");
        });

        it("should create distinct addresses for different min", () => {
            const participants = [];
            const addresses = new Set();

            for (let i = 1; i < 16; i++) {
                participants.push(PublicKey.fromPassphrase(`secret ${i}`));
            }

            for (let i = 1; i < 16; i++) {
                addresses.add(
                    Address.fromMultiSignatureAsset({
                        min: i,
                        publicKeys: participants,
                    }),
                );
            }

            expect([...addresses]).toHaveLength(15);
        });

        it("should fail with invalid input", () => {
            expect(() => {
                Address.fromMultiSignatureAsset({
                    min: 7,
                    publicKeys: ["secret 1", "secret 2", "secret 3"].map(secret => PublicKey.fromPassphrase(secret)),
                });
            }).toThrowError(InvalidMultiSignatureAssetError);

            expect(() => {
                Address.fromMultiSignatureAsset({
                    min: 1,
                    publicKeys: [],
                });
            }).toThrowError(InvalidMultiSignatureAssetError);

            expect(() => {
                Address.fromMultiSignatureAsset({
                    min: 1,
                    publicKeys: ["garbage"],
                });
            }).toThrowError(PublicKeyError);
        });
    });

    describe("fromPrivateKey", () => {
        it("should be OK", () => {
            expect(Address.fromPrivateKey(Keys.fromPassphrase(passphrase))).toBe(data.address);
        });
    });

    describe("validate", () => {
        it("should pass with a valid address", () => {
            expect(Address.validate(data.address)).toBeTrue();
        });

        it("should fail with an invalid address", () => {
            expect(Address.validate("invalid")).toBeFalse();
        });
    });
});
