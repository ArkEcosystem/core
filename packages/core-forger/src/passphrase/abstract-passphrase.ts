import { Passphrase, UseKeysFunction } from "../interfaces";

export abstract class AbstractPassphrase implements Passphrase {
    protected constructor(private publicKey: string, private address: string) {}

    public getPublicKey(): string {
        return this.publicKey;
    }

    public getAddress(): string {
        return this.address;
    }

    public abstract useKeys(fn: UseKeysFunction);
}
