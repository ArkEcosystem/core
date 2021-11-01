import "@packages/core-test-framework/src/matchers/fields/public-key";
import { Identities } from "@packages/crypto";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";

let publicKey: string;

beforeEach(() => {
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
