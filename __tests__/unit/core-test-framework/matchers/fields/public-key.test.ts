import "@packages/core-test-framework/src/matchers/fields/public-key";

import { CryptoSuite } from "@packages/core-crypto";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";

let publicKey: string;

let Identities;

beforeEach(() => {
    const crypto = new CryptoSuite.CryptoSuite();
    Identities = crypto.CryptoManager.Identities;
    publicKey = Identities.PublicKey.fromPassphrase(passphrases[0]);
});

describe("PublicKey", () => {
    describe("toBePublicKey", () => {
        it("should be valid public key", async () => {
            expect(publicKey).toBePublicKey();
        });

        it("should not be valid public key", async () => {
            publicKey = "invalid_public_key";
            expect(publicKey).not.toBePublicKey();
        });
    });
});
