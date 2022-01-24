import { Contracts } from "@arkecosystem/core-kernel";
import { Identities, Interfaces } from "@arkecosystem/crypto";

import { AbstractKeyPairHolder } from "./abstract-key-pair-holder";

export class Bip39KeyPairHolder extends AbstractKeyPairHolder {
    private readonly keys: Interfaces.IKeyPair;

    public constructor(passphrase: string) {
        const keys = Identities.Keys.fromPassphrase(passphrase);
        super(keys.publicKey);

        this.keys = keys;
    }

    public useKeys<T>(fn: Contracts.Shared.UseKeysFunction<T>): T {
        return fn(this.keys);
    }
}
