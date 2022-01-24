import { Bip39KeyPairHolder } from "@packages/core-kernel/src/utils/key-pair-holders/bip39-key-pair-holder";
import { Identities, Interfaces } from "@packages/crypto";

const passphrase: string = "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire";

describe("Bip39KeyPairHolder", () => {
    it("should be ok with a plain text passphrase", () => {
        const bip39KeyPairHolder = new Bip39KeyPairHolder(passphrase);

        expect(bip39KeyPairHolder.getPublicKey()).toBe(Identities.PublicKey.fromPassphrase(passphrase));
        expect(bip39KeyPairHolder.getAddress()).toBe(Identities.Address.fromPassphrase(passphrase));
    });

    it("should call useKey with valid keyPair", () => {
        const bip39KeyPairHolder = new Bip39KeyPairHolder(passphrase);
        let keys: Interfaces.IKeyPair | undefined;
        bip39KeyPairHolder.useKeys((tmpKeys) => {
            keys = tmpKeys;
        });

        expect(keys).toEqual(Identities.Keys.fromPassphrase(passphrase));
    });
});
