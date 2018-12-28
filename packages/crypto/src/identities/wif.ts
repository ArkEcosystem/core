import wif from "wif";
import { configManager } from "../managers";
import { Keys } from "./keys";

export class WIF {
    public static fromPassphrase(passphrase, network?: any) {
        const keys = Keys.fromPassphrase(passphrase);

        if (!network) {
            network = configManager.all();
        }

        return wif.encode(network.wif, Buffer.from(keys.privateKey, "hex"), keys.compressed);
    }
}
