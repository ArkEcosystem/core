import { Bip38KeyPairHolder } from "@packages/core-forger/src/key-pair-holders/bip38-key-pair-holder";
import { Identities, Interfaces } from "@packages/crypto";

const passphrase: string = "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire";
const bip38: string = "6PYTQC4c2vBv6PGvV4HibNni6wNsHsGbR1qpL1DfkCNihsiWwXnjvJMU4B";

describe("Bip38KeyPairHolder", () => {
    it("should pass with a valid password", () => {
        const bip38Passphrase = new Bip38KeyPairHolder(bip38, "bip38-password");

        expect(bip38Passphrase.getPublicKey()).toBe(Identities.PublicKey.fromPassphrase(passphrase));
        expect(bip38Passphrase.getAddress()).toBe(Identities.Address.fromPassphrase(passphrase));
    });

    it("should fail with an invalid password", () => {
        expect(() => new Bip38KeyPairHolder(bip38, "invalid-password")).toThrow();
    });

    it("should call useKey with valid keyPair", () => {
        const bip38Passphrase = new Bip38KeyPairHolder(bip38, "bip38-password");

        for (let i = 0; i < 3; i++) {
            let keys: Interfaces.IKeyPair | undefined;
            bip38Passphrase.useKeys((tmpKeys) => {
                keys = tmpKeys;
            });

            expect(keys).toEqual(Identities.Keys.fromPassphrase(passphrase));
        }
    });
});
