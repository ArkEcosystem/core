import "jest-extended";

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
