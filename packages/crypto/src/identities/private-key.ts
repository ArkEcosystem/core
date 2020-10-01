import { PrivateKey as BasePrivateKey } from "@arkecosystem/crypto-identities";

import { configManager } from "../managers";
import { NetworkType } from "../types";

export class PrivateKey {
    public static fromPassphrase(passphrase: string): string {
        return BasePrivateKey.fromPassphrase(passphrase);
    }

    public static fromWIF(wif: string, network?: NetworkType): string {
        if (!network) {
            network = configManager.get("network.wif");
        }

        return BasePrivateKey.fromWIF(wif, { wif: (network as unknown) as number });
    }
}
