import { PublicKey as BasePublicKey } from "@arkecosystem/crypto-identities";

import { IMultiSignatureAsset } from "../interfaces";
import { configManager } from "../managers";
import { NetworkType } from "../types";

export class PublicKey {
    public static fromPassphrase(passphrase: string): string {
        return BasePublicKey.fromPassphrase(passphrase);
    }

    public static fromWIF(wif: string, network?: NetworkType): string {
        if (!network) {
            network = configManager.get("network.wif");
        }

        return BasePublicKey.fromWIF(wif, { wif: (network as unknown) as number });
    }

    public static fromMultiSignatureAsset(asset: IMultiSignatureAsset): string {
        return BasePublicKey.fromMultiSignatureAsset(asset);
    }

    public static verify(publicKey: string): boolean {
        return BasePublicKey.verify(publicKey);
    }
}
