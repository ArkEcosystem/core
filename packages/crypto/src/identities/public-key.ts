import { configManager } from "../managers/config";
import { Address } from "./address";
import { Keys } from "./keys";

export class PublicKey {
    public static fromPassphrase(passphrase) {
        return Keys.fromPassphrase(passphrase).publicKey;
    }

    // static fromHex (publicKey) {}

    public static fromWIF(wif, network?: any) {
        return Keys.fromWIF(wif, network).publicKey;
    }

    public static validate(publicKey, networkVersion?: any) {
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
