import { Identities } from "@arkecosystem/crypto";
import { BIP38 } from "@packages/core-forger/src/methods/bip38";

const passphrase: string = "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire";
const bip38: string = "6PYTQC4c2vBv6PGvV4HibNni6wNsHsGbR1qpL1DfkCNihsiWwXnjvJMU4B";

describe("Methods -> BIP38", () => {
    it("should pass with a valid passphrase", () => {
        const delegate = new BIP38(bip38, "bip38-password");

        expect(delegate.publicKey).toBe(Identities.PublicKey.fromPassphrase(passphrase));
        expect(delegate.address).toBe(Identities.Address.fromPassphrase(passphrase));
    });

    it("should fail with an invalid passphrase", () => {
        expect(() => new BIP38(bip38, "invalid-password")).toThrow();
    });
});
