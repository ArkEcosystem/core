import { Keys } from "./keys";

export class PrivateKey {
    public static fromPassphrase(passphrase) {
        return Keys.fromPassphrase(passphrase).privateKey;
    }

    // static fromHex (privateKey) {}

    public static fromWIF(wif, network?: any) {
        return Keys.fromWIF(wif, network).privateKey;
    }
}
