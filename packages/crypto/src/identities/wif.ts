import wif from "wif";
import { IKeyPair } from "../interfaces";
import { configManager } from "../managers";
import { NetworkType } from "../types";
import { Keys } from "./keys";

export class WIF {
    public static fromPassphrase(passphrase: string, network?: NetworkType): string {
        const keys = Keys.fromPassphrase(passphrase);

        if (!network) {
            network = configManager.all();
        }

        return wif.encode(network.wif, Buffer.from(keys.privateKey, "hex"), keys.compressed);
    }

    public static fromKeys(keys: IKeyPair, network?: { wif: number }): string {
        if (!network) {
            network = configManager.all();
        }

        return wif.encode(network.wif, Buffer.from(keys.privateKey, "hex"), keys.compressed);
    }
}
