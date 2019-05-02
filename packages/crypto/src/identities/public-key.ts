import { secp256k1 } from "bcrypto";
import { Utils } from "..";
import { InvalidMultiSignatureAssetError, PublicKeyError } from "../errors";
import { IMultiSignatureAsset } from "../interfaces";
import { configManager } from "../managers";
import { NetworkType } from "../types";
import { Address } from "./address";
import { Keys } from "./keys";

export class PublicKey {
    public static fromPassphrase(passphrase: string): string {
        return Keys.fromPassphrase(passphrase).publicKey;
    }

    public static fromWIF(wif: string, network?: NetworkType): string {
        return Keys.fromWIF(wif, network).publicKey;
    }

    public static fromMultiSignatureAsset(asset: IMultiSignatureAsset): string {
        const { min, publicKeys }: IMultiSignatureAsset = asset;

        publicKeys.forEach(publicKey => {
            if (!/^[0-9A-Fa-f]{66}$/.test(publicKey)) {
                throw new PublicKeyError(publicKey);
            }
        });

        if (min < 1 || min > publicKeys.length) {
            throw new InvalidMultiSignatureAssetError();
        }

        const minKey: string = PublicKey.fromPassphrase(Utils.numberToHex(min));
        const keys: string[] = [minKey, ...publicKeys];

        return keys.reduce((previousValue: string, currentValue: string) =>
            secp256k1
                .publicKeyAdd(Buffer.from(previousValue, "hex"), Buffer.from(currentValue, "hex"), true)
                .toString("hex"),
        );
    }

    public static validate(publicKey: string, networkVersion?: number): boolean {
        if (!networkVersion) {
            networkVersion = configManager.get("network.pubKeyHash");
        }

        try {
            return Address.fromPublicKey(publicKey, networkVersion).length === 34;
        } catch (e) {
            return false;
        }
    }
}
