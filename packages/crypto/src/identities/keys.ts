import { Keys as Identity } from "@arkecosystem/crypto-identities";

import { IKeyPair } from "../interfaces";
import { Network } from "../interfaces/networks";
import { getWifFromNetwork } from "./helpers";

export class Keys {
    public static fromPassphrase(passphrase: string, compressed = true): IKeyPair {
        return Identity.fromPassphrase(passphrase, compressed);
    }

    public static fromPrivateKey(privateKey: Buffer | string, compressed = true): IKeyPair {
        return Identity.fromPrivateKey(privateKey, compressed);
    }

    public static fromWIF(wifKey: string, network?: Network): IKeyPair {
        return Identity.fromWIF(wifKey, { wif: getWifFromNetwork(network) });
    }
}
