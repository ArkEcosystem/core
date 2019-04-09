import "jest-extended";

import { PublicKeyError } from "../../../../packages/crypto/src/errors";
import { Identities } from "../../../../packages/crypto/src/identities/address";
import { Keys } from "../../../../packages/crypto/src/identities/keys";
import { data, passphrase } from "./fixture.json";

describe("Identities - Address", () => {
    describe("fromPassphrase", () => {
        it("should be OK", () => {
            expect(Identities.Address.fromPassphrase(passphrase)).toBe(data.address);
        });
    });

    describe("fromPublicKey", () => {
        it("should pass with a valid public key", () => {
            expect(Identities.Address.fromPublicKey(data.publicKey)).toBe(data.address);
        });

        it("should fail with an invalid public key", () => {
            expect(() => {
                Identities.Address.fromPublicKey("invalid");
            }).toThrow(PublicKeyError);
        });
    });

    describe("fromPrivateKey", () => {
        it("should be OK", () => {
            expect(Identities.Address.fromPrivateKey(Keys.fromPassphrase(passphrase))).toBe(data.address);
        });
    });

    describe("validate", () => {
        it("should pass with a valid address", () => {
            expect(Identities.Address.validate(data.address)).toBeTrue();
        });

        it("should fail with an invalid address", () => {
            expect(Identities.Address.validate("invalid")).toBeFalse();
        });
    });
});
