import "jest-extended";

import { PublicKeyError } from "../../src/errors";
import { Address } from "../../src/identities/address";
import { Keys } from "../../src/identities/keys";
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
