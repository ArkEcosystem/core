import { Keys } from "../identities";
import { IKeyPair, UseKeysFunction } from "../interfaces/identities";
import { AbstractKeyPairHolder } from "./abstract";

export class Bip39 extends AbstractKeyPairHolder {
    private readonly keys: IKeyPair;

    public constructor(passphrase: string) {
        const keys = Keys.fromPassphrase(passphrase);
        super(keys.publicKey);

        this.keys = keys;
    }

    public useKeys<T>(fn: UseKeysFunction<T>): T {
        return fn(this.keys);
    }
}
