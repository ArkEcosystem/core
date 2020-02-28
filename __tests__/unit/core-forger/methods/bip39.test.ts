import { Identities } from "@arkecosystem/crypto";
import { BIP39 } from "@packages/core-forger/src/methods/bip39";

const passphrase: string = "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire";

describe("Methods -> BIP39", () => {
    it("should be ok with a plain text passphrase", () => {
        const delegate = new BIP39(passphrase);

        expect(delegate.publicKey).toBe(Identities.PublicKey.fromPassphrase(passphrase));
        expect(delegate.address).toBe(Identities.Address.fromPassphrase(passphrase));
    });
});
