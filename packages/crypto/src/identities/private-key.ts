import { Keys } from "./keys";

export class PrivateKey {
    public constructor(private keys: Keys) {}

    public fromPassphrase(passphrase: string): string {
        return this.keys.fromPassphrase(passphrase).privateKey;
    }

    public fromWIF(wif: string): string {
        return this.keys.fromWIF(wif).privateKey;
    }
}
