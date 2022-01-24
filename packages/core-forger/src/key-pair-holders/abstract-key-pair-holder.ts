import { Contracts } from "@arkecosystem/core-kernel";
import { Identities } from "@arkecosystem/crypto";

export abstract class AbstractKeyPairHolder implements Contracts.Shared.KeyPairHolder {
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

    public abstract useKeys<T>(fn: Contracts.Shared.UseKeysFunction<T>): T;
}
