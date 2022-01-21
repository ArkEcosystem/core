import { Identities, Interfaces } from "@arkecosystem/crypto";

import { UseKeysFunction } from "../interfaces";
import { AbstractPassphrase } from "./abstract-passphrase";

export class Bip39Passphrase extends AbstractPassphrase {
    private readonly keys: Interfaces.IKeyPair;

    public constructor(passphrase: string) {
        const keys = Identities.Keys.fromPassphrase(passphrase);
        super(keys.publicKey);

        this.keys = keys;
    }

    public useKeys(fn: UseKeysFunction) {
        fn(this.keys);
    }
}
