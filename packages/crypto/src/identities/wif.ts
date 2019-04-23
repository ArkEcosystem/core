import wif from "wif";
import { IKeyPair } from "../interfaces";
import { INetwork } from "../interfaces/networks";
import { configManager } from "../managers";
import { Keys } from "./keys";

export class WIF {
    public static fromPassphrase(passphrase: string, network?: INetwork): string {
        const keys: IKeyPair = Keys.fromPassphrase(passphrase);

        if (!network) {
            network = configManager.get("network");
        }

        return wif.encode(network.wif, Buffer.from(keys.privateKey, "hex"), keys.compressed);
    }

    public static fromKeys(keys: IKeyPair, network?: INetwork): string {
        if (!network) {
            network = configManager.get("network");
        }

        return wif.encode(network.wif, Buffer.from(keys.privateKey, "hex"), keys.compressed);
    }
}
