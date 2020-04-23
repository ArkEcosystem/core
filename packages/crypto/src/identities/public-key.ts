import { InvalidMultiSignatureAssetError, PublicKeyError } from "../errors";
import { IMultiSignatureAsset } from "../interfaces";
import { Keys } from "./keys";

export class PublicKey {
    /**
     *
     * @param keys
     * @param secp256k1 // import { secp256k1 } from "bcrypto";
     * @param numberToHex // import { numberToHex } from "../utils";
     */
    public constructor(private keys: Keys, private secp256k1: any, private numberToHex: any) {}

    public fromPassphrase(passphrase: string): string {
        return this.keys.fromPassphrase(passphrase).publicKey;
    }

    public fromWIF(wif: string): string {
        return this.keys.fromWIF(wif).publicKey;
    }

    public fromMultiSignatureAsset(asset: IMultiSignatureAsset): string {
        const { min, publicKeys }: IMultiSignatureAsset = asset;

        for (const publicKey of publicKeys) {
            if (!/^[0-9A-Fa-f]{66}$/.test(publicKey)) {
                throw new PublicKeyError(publicKey);
            }
        }

        if (min < 1 || min > publicKeys.length) {
            throw new InvalidMultiSignatureAssetError();
        }

        const minKey: string = this.fromPassphrase(this.numberToHex(min));
        const keys: string[] = [minKey, ...publicKeys];

        return keys.reduce((previousValue: string, currentValue: string) =>
            this.secp256k1
                .publicKeyAdd(Buffer.from(previousValue, "hex"), Buffer.from(currentValue, "hex"), true)
                .toString("hex"),
        );
    }
}
