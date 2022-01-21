import { Bip39KeyPairHolder } from "@packages/core-forger/src/key-pair-holders/bip39-key-pair-holder";
import { Identities, Interfaces } from "@packages/crypto";

const passphrase: string = "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire";

describe("Bip39KeyPairHolder", () => {
    it("should be ok with a plain text passphrase", () => {
        const bip39Passphrase = new Bip39KeyPairHolder(passphrase);

        expect(bip39Passphrase.getPublicKey()).toBe(Identities.PublicKey.fromPassphrase(passphrase));
        expect(bip39Passphrase.getAddress()).toBe(Identities.Address.fromPassphrase(passphrase));
    });

    it("should call useKey with valid keyPair", () => {
        const bip39Passphrase = new Bip39KeyPairHolder(passphrase);
        let keys: Interfaces.IKeyPair | undefined;
        bip39Passphrase.useKeys((tmpKeys) => {
            keys = tmpKeys;
        });

        expect(keys).toEqual(Identities.Keys.fromPassphrase(passphrase));
    });
});
