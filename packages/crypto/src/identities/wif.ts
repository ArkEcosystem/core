import wif from "wif";
import { configManager } from "../managers";
import { INetwork } from "../types";
import { KeyPair, Keys } from "./keys";

export class WIF {
    public static fromPassphrase(passphrase: string, network?: INetwork): string {
        const keys = Keys.fromPassphrase(passphrase);

        if (!network) {
            network = configManager.all();
        }

        return wif.encode(network.wif, Buffer.from(keys.privateKey, "hex"), keys.compressed);
    }

    public static fromKeys(keys: KeyPair, network?: { wif: number }): string {
        if (!network) {
            network = configManager.all();
        }

        return wif.encode(network.wif, Buffer.from(keys.privateKey, "hex"), keys.compressed);
    }
}
