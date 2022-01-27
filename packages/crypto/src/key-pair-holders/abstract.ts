import { Address } from "../identities/address";
import { KeyPairHolder, UseKeysFunction } from "../interfaces/identities";

export abstract class AbstractKeyPairHolder implements KeyPairHolder {
    protected address: string;

    protected constructor(private publicKey: string) {
        this.address = Address.fromPublicKey(this.publicKey);
    }

    public getPublicKey(): string {
        return this.publicKey;
    }

    public getAddress(): string {
        return this.address;
    }

    public abstract useKeys<T>(fn: UseKeysFunction<T>): T;
}
