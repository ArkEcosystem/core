import { PrivateKey as Identity } from "@arkecosystem/crypto-identities";

import { Network } from "../interfaces";
import { getWifFromNetwork } from "./helpers";

export class PrivateKey {
    public static fromPassphrase(passphrase: string): string {
        return Identity.fromPassphrase(passphrase);
    }

    public static fromWIF(wif: string, network?: Network): string {
        return Identity.fromWIF(wif, { wif: getWifFromNetwork(network) });
    }
}
