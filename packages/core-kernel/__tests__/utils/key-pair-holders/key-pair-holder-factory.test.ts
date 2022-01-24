import { KeyPairHolderFactory } from "@packages/core-kernel/src/utils/key-pair-holders";
import { Identities } from "@packages/crypto";

const passphrase38: string = "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire";
const bip38: string = "6PYTQC4c2vBv6PGvV4HibNni6wNsHsGbR1qpL1DfkCNihsiWwXnjvJMU4B";
const passphrase39: string = "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire";

describe("PassphraseFactory", () => {
    describe("bip38", () => {
        it("should create delegate with a valid bip38 passphrase", () => {
            const kayPairHolder = KeyPairHolderFactory.fromBIP38(bip38, "bip38-password");

            expect(kayPairHolder.getPublicKey()).toBe(Identities.PublicKey.fromPassphrase(passphrase38));
            expect(kayPairHolder.getAddress()).toBe(Identities.Address.fromPassphrase(passphrase38));
        });

        it("should fail with an invalid passphrase", () => {
            expect(() => KeyPairHolderFactory.fromBIP38(bip38, "invalid-password")).toThrow();
        });

        it("should fail with an invalid bip38", () => {
            expect(() => KeyPairHolderFactory.fromBIP38("wrong", "bip38-password")).toThrow("Not bip38");
        });
    });

    describe("bip39", () => {
        it("should be ok with a plain text passphrase", () => {
            const keyPairHolder = KeyPairHolderFactory.fromBIP39(passphrase39);

            expect(keyPairHolder.getPublicKey()).toBe(Identities.PublicKey.fromPassphrase(passphrase39));
            expect(keyPairHolder.getAddress()).toBe(Identities.Address.fromPassphrase(passphrase39));
        });

        it("should throw if given a bip38 passphrase", () => {
            expect(() => KeyPairHolderFactory.fromBIP39(bip38)).toThrow("Not bip39");
        });
    });
});
