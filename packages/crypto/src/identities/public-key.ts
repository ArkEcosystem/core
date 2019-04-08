import { configManager } from "../managers";
import { INetwork } from "../types";
import { Address } from "./address";
import { Keys } from "./keys";

export class PublicKey {
    public static fromPassphrase(passphrase: string): string {
        return Keys.fromPassphrase(passphrase).publicKey;
    }

    public static fromWIF(wif: string, network?: INetwork): string {
        return Keys.fromWIF(wif, network).publicKey;
    }

    public static validate(publicKey: string, networkVersion?: number): boolean {
        if (!networkVersion) {
            networkVersion = configManager.get("pubKeyHash");
        }

        try {
            return Address.fromPublicKey(publicKey, networkVersion).length === 34;
        } catch (e) {
            return false;
        }
    }
}
