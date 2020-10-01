import { Keys as BaseKeys } from "@arkecosystem/crypto-identities";

import { IKeyPair } from "../interfaces";
import { Network } from "../interfaces/networks";
import { configManager } from "../managers";

export class Keys {
    public static fromPassphrase(passphrase: string, compressed = true): IKeyPair {
        return BaseKeys.fromPassphrase(passphrase, compressed);
    }

    public static fromPrivateKey(privateKey: Buffer | string, compressed = true): IKeyPair {
        return BaseKeys.fromPrivateKey(privateKey, compressed);
    }

    public static fromWIF(wifKey: string, network?: Network): IKeyPair {
        if (!network) {
            network = configManager.get("network.wif");
        }

        return BaseKeys.fromWIF(wifKey, { wif: (network as unknown) as number });
    }
}
