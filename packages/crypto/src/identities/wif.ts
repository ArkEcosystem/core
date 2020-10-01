import { WIF as BaseWIF } from "@arkecosystem/crypto-identities";

import { IKeyPair } from "../interfaces";
import { Network } from "../interfaces/networks";
import { configManager } from "../managers";

export class WIF {
    public static fromPassphrase(passphrase: string, network?: Network): string {
        if (!network) {
            network = configManager.get("network.wif");
        }

        return BaseWIF.fromPassphrase(passphrase, { wif: (network as unknown) as number });
    }

    public static fromKeys(keys: IKeyPair, network?: Network): string {
        if (!network) {
            network = configManager.get("network.wif");
        }

        return BaseWIF.fromKeys(keys, { wif: (network as unknown) as number });
    }
}
