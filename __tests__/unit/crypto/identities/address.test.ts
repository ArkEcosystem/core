import "jest-extended";

import { CryptoManager } from "@packages/crypto/src";

import { InvalidMultiSignatureAssetError, PublicKeyError } from "../../../../packages/crypto/src/errors";
import { data, passphrase } from "./fixture.json";

describe("Identities - Address", () => {
    let Address;
    let PublicKey;
    let Keys;
    let AddressMainNet;

    beforeAll(() => {
        const devnetCrypto = CryptoManager.createFromPreset("devnet");
        Address = devnetCrypto.identities.address;
        PublicKey = devnetCrypto.identities.publicKey;
        Keys = devnetCrypto.identities.keys;

        const mainnetCrypto = CryptoManager.createFromPreset("mainnet");
        AddressMainNet = mainnetCrypto.identities.address;
    });

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

    describe("fromWIF", () => {
        it("should pass with a valid wif", () => {
            expect(Address.fromWIF(data.wif)).toBe(data.address);
        });

        it("should fail with an invalid wif", () => {
            expect(() => {
                Address.fromWIF("invalid");
            }).toThrow(Error);
        });
    });

    describe("fromMultiSignatureAddress", () => {
        it("should be ok", () => {
            expect(
                Address.fromMultiSignatureAsset({
                    min: 3,
                    publicKeys: ["secret 1", "secret 2", "secret 3"].map((secret) => PublicKey.fromPassphrase(secret)),
                }),
            ).toBe("DMS861mLRrtH47QUMVif3C2rBCAdHbmwsi");
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
                    publicKeys: ["secret 1", "secret 2", "secret 3"].map((secret) => PublicKey.fromPassphrase(secret)),
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

    describe("toBuffer", () => {
        it("should be OK", () => {
            expect(Address.toBuffer("DMS861mLRrtH47QUMVif3C2rBCAdHbmwsi").addressError).toBeUndefined();
        });

        it("should not be OK", () => {
            expect(Address.toBuffer("AdVSe37niA3uFUPgCgMUH2tMsHF4LpLoiX").addressError).not.toBeUndefined();
        });
    });

    describe("fromBuffer", () => {
        it("should be OK", () => {
            const { addressBuffer } = Address.toBuffer("DMS861mLRrtH47QUMVif3C2rBCAdHbmwsi");
            expect(Address.fromBuffer(addressBuffer)).toEqual("DMS861mLRrtH47QUMVif3C2rBCAdHbmwsi");
        });
    });

    describe("validate", () => {
        it("should pass with a valid address", () => {
            expect(Address.validate(data.address)).toBeTrue();
        });

        it("should fail with an invalid address", () => {
            expect(Address.validate("invalid")).toBeFalse();
        });

        it("should validate MAINNET addresses", () => {
            expect(AddressMainNet.validate("AdVSe37niA3uFUPgCgMUH2tMsHF4LpLoiX")).toBeTrue();
        });

        it("should validate DEVNET addresses", () => {
            expect(Address.validate("DARiJqhogp2Lu6bxufUFQQMuMyZbxjCydN")).toBeTrue();
        });
    });
});
