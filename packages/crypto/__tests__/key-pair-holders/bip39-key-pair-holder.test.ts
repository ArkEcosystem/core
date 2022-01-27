import { Identities, Interfaces } from "@packages/crypto";
import { Bip39 } from "@packages/crypto/src/key-pair-holders/bip39";

const passphrase: string = "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire";

describe("Bip39KeyPairHolder", () => {
    it("should be ok with a plain text passphrase", () => {
        const bip39KeyPairHolder = new Bip39(passphrase);

        expect(bip39KeyPairHolder.getPublicKey()).toBe(Identities.PublicKey.fromPassphrase(passphrase));
        expect(bip39KeyPairHolder.getAddress()).toBe(Identities.Address.fromPassphrase(passphrase));
    });

    it("should call useKey with valid keyPair", () => {
        const bip39KeyPairHolder = new Bip39(passphrase);
        let keys: Interfaces.IKeyPair | undefined;
        bip39KeyPairHolder.useKeys((tmpKeys) => {
            keys = tmpKeys;
        });

        expect(keys).toEqual(Identities.Keys.fromPassphrase(passphrase));
    });
});
