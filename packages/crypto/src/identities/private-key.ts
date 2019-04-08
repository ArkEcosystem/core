import { INetwork } from "../types";
import { Keys } from "./keys";

export class PrivateKey {
    public static fromPassphrase(passphrase: string): string {
        return Keys.fromPassphrase(passphrase).privateKey;
    }

    public static fromWIF(wif: string, network?: INetwork): string {
        return Keys.fromWIF(wif, network).privateKey;
    }
}
