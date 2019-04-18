import "jest-extended";

import { PublicKeyError } from "../../../../packages/crypto/src/errors";
import { Address } from "../../../../packages/crypto/src/identities/address";
import { Keys } from "../../../../packages/crypto/src/identities/keys";
import { configManager } from "../../../../packages/crypto/src/managers";
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

        it("should validate MAINNET addresses", () => {
            configManager.setConfig(configManager.getPreset("mainnet"));

            expect(Address.validate("AdVSe37niA3uFUPgCgMUH2tMsHF4LpLoiX")).toBeTrue();
        });

        it("should validate DEVNET addresses", () => {
            configManager.setConfig(configManager.getPreset("devnet"));

            expect(Address.validate("DARiJqhogp2Lu6bxufUFQQMuMyZbxjCydN")).toBeTrue();
        });
    });
});
