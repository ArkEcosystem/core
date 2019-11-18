import "jest-extended";

import { InvalidMultiSignatureAssetError, PublicKeyError } from "@arkecosystem/crypto/src/errors";
import { PublicKey } from "../../../../packages/crypto/src/identities/public-key";
import { configManager } from "../../../../packages/crypto/src/managers";
import { data, passphrase } from "./fixture.json";

describe("Identities - Public Key", () => {
    describe("fromPassphrase", () => {
        it("should be OK", () => {
            expect(PublicKey.fromPassphrase(passphrase)).toBe(data.publicKey);
        });
    });

    describe("fromWIF", () => {
        it("should be OK", () => {
            expect(PublicKey.fromWIF(data.wif)).toBe(data.publicKey);
        });
    });

    describe("fromMultiSignatureAddress", () => {
        it("should be ok", () => {
            expect(
                PublicKey.fromMultiSignatureAsset({
                    min: 3,
                    publicKeys: ["secret 1", "secret 2", "secret 3"].map(secret => PublicKey.fromPassphrase(secret)),
                }),
            ).toBe("0279f05076556da7173610a7676399c3620276ebbf8c67552ad3b1f26ec7627794");
        });

        it("should create the same public key for all permutations", () => {
            const publicKeySet = new Set();

            const permutations = [
                [
                    "0235d486fea0193cbe77e955ab175b8f6eb9eaf784de689beffbd649989f5d6be3",
                    "03a46f2547d20b47003c1c376788db5a54d67264df2ae914f70bf453b6a1fa1b3a",
                    "03d7dfe44e771039334f4712fb95ad355254f674c8f5d286503199157b7bf7c357",
                ],
                [
                    "0235d486fea0193cbe77e955ab175b8f6eb9eaf784de689beffbd649989f5d6be3",
                    "03d7dfe44e771039334f4712fb95ad355254f674c8f5d286503199157b7bf7c357",
                    "03a46f2547d20b47003c1c376788db5a54d67264df2ae914f70bf453b6a1fa1b3a",
                ],
                [
                    "03a46f2547d20b47003c1c376788db5a54d67264df2ae914f70bf453b6a1fa1b3a",
                    "0235d486fea0193cbe77e955ab175b8f6eb9eaf784de689beffbd649989f5d6be3",
                    "03d7dfe44e771039334f4712fb95ad355254f674c8f5d286503199157b7bf7c357",
                ],
                [
                    "03a46f2547d20b47003c1c376788db5a54d67264df2ae914f70bf453b6a1fa1b3a",
                    "03d7dfe44e771039334f4712fb95ad355254f674c8f5d286503199157b7bf7c357",
                    "0235d486fea0193cbe77e955ab175b8f6eb9eaf784de689beffbd649989f5d6be3",
                ],
                [
                    "03d7dfe44e771039334f4712fb95ad355254f674c8f5d286503199157b7bf7c357",
                    "03a46f2547d20b47003c1c376788db5a54d67264df2ae914f70bf453b6a1fa1b3a",
                    "0235d486fea0193cbe77e955ab175b8f6eb9eaf784de689beffbd649989f5d6be3",
                ],
                [
                    "03d7dfe44e771039334f4712fb95ad355254f674c8f5d286503199157b7bf7c357",
                    "0235d486fea0193cbe77e955ab175b8f6eb9eaf784de689beffbd649989f5d6be3",
                    "03a46f2547d20b47003c1c376788db5a54d67264df2ae914f70bf453b6a1fa1b3a",
                ],
            ];

            for (const publicKeys of permutations) {
                publicKeySet.add(
                    PublicKey.fromMultiSignatureAsset({
                        min: 2,
                        publicKeys,
                    }),
                );
            }

            expect([...publicKeySet]).toHaveLength(1);
        });

        it("should create distinct public keys for different min", () => {
            const participants = [];
            const publicKeys = new Set();

            for (let i = 1; i < 16; i++) {
                participants.push(PublicKey.fromPassphrase(`secret ${i}`));
            }

            for (let i = 1; i < 16; i++) {
                publicKeys.add(
                    PublicKey.fromMultiSignatureAsset({
                        min: i,
                        publicKeys: participants,
                    }),
                );
            }

            expect([...publicKeys]).toHaveLength(15);
        });

        it("should fail with invalid input", () => {
            expect(() => {
                PublicKey.fromMultiSignatureAsset({
                    min: 7,
                    publicKeys: ["secret 1", "secret 2", "secret 3"].map(secret => PublicKey.fromPassphrase(secret)),
                });
            }).toThrowError(InvalidMultiSignatureAssetError);

            expect(() => {
                PublicKey.fromMultiSignatureAsset({
                    min: 1,
                    publicKeys: [],
                });
            }).toThrowError(InvalidMultiSignatureAssetError);

            expect(() => {
                PublicKey.fromMultiSignatureAsset({
                    min: 1,
                    publicKeys: ["garbage"],
                });
            }).toThrowError(PublicKeyError);
        });
    });

    describe("validate", () => {
        it("should pass with a valid public key", () => {
            expect(PublicKey.validate(data.publicKey)).toBeTrue();
        });

        it("should fail with an invalid public key", () => {
            expect(PublicKey.validate("invalid")).toBeFalse();
        });

        it("should validate MAINNET public keys", () => {
            configManager.setConfig(configManager.getPreset("mainnet"));

            expect(PublicKey.validate("02b54f00d9de5a3ace28913fe78a15afcfe242926e94d9b517d06d2705b261f992")).toBeTrue();
        });

        it("should validate DEVNET public keys", () => {
            configManager.setConfig(configManager.getPreset("devnet"));

            expect(PublicKey.validate("03b906102928cf97c6ddeb59cefb0e1e02105a22ab1acc3b4906214a16d494db0a")).toBeTrue();
        });
    });
});
