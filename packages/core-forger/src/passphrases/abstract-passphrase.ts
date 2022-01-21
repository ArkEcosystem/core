import { Identities } from "@arkecosystem/crypto";

import { Passphrase, UseKeysFunction } from "../interfaces";

export abstract class AbstractPassphrase implements Passphrase {
    protected address: string;

    protected constructor(private publicKey: string) {
        this.address = Identities.Address.fromPublicKey(this.publicKey);
    }

    public getPublicKey(): string {
        return this.publicKey;
    }

    public getAddress(): string {
        return this.address;
    }

    public abstract useKeys(fn: UseKeysFunction);
}
