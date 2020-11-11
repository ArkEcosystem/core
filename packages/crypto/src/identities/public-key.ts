import { PublicKey as Identity } from "@arkecosystem/crypto-identities";

import { IMultiSignatureAsset, Network } from "../interfaces";
import { getWifFromNetwork } from "./helpers";

export class PublicKey {
    public static fromPassphrase(passphrase: string): string {
        return Identity.fromPassphrase(passphrase);
    }

    public static fromWIF(wif: string, network?: Network): string {
        return Identity.fromWIF(wif, { wif: getWifFromNetwork(network) });
    }

    public static fromMultiSignatureAsset(asset: IMultiSignatureAsset): string {
        return Identity.fromMultiSignatureAsset(asset);
    }

    public static verify(publicKey: string): boolean {
        return Identity.verify(publicKey);
    }
}
