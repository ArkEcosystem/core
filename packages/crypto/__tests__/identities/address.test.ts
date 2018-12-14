import "jest-extended";

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
        it("should be OK", () => {
            expect(Address.fromPublicKey(data.publicKey)).toBe(data.address);
        });
    });

    describe("fromPrivateKey", () => {
        it("should be OK", () => {
            expect(Address.fromPrivateKey(Keys.fromPassphrase(passphrase))).toBe(data.address);
        });
    });

    describe("validate", () => {
        it("should be OK", () => {
            expect(Address.validate(data.address)).toBeTrue();
        });
    });
});
