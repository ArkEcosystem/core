import { Identities } from "@arkecosystem/crypto";

import { KeyPairHolder, UseKeysFunction } from "../interfaces";

export abstract class AbstractKeyPairHolder implements KeyPairHolder {
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

    public abstract useKeys<T>(fn: UseKeysFunction<T>): T;
}
