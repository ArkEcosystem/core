import "jest-extended";

import { PublicKey } from "../../../../packages/crypto/src/identities/public-key";
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

    describe("validate", () => {
        it("should pass with a valid public key", () => {
            expect(PublicKey.validate(data.publicKey)).toBeTrue();
        });

        it("should fail with an invalid public key", () => {
            expect(PublicKey.validate("invalid")).toBeFalse();
        });
    });
});
