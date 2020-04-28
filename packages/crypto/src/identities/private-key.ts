import { Keys } from "./keys";

export class PrivateKey<T> {
    public constructor(private keys: Keys<T>) {}

    public fromPassphrase(passphrase: string): string {
        return this.keys.fromPassphrase(passphrase).privateKey;
    }

    public fromWIF(wif: string): string {
        return this.keys.fromWIF(wif).privateKey;
    }
}
