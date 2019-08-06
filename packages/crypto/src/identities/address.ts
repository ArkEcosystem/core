import { HashAlgorithms } from "../crypto";
import { PublicKeyError } from "../errors";
import { IMultiSignatureAsset } from "../interfaces";
import { configManager } from "../managers";
import { Base58 } from "../utils";
import { PublicKey } from "./public-key";

export class Address {
    public static fromPassphrase(passphrase: string, networkVersion?: number): string {
        return Address.fromPublicKey(PublicKey.fromPassphrase(passphrase), networkVersion);
    }

    public static fromPublicKey(publicKey: string, networkVersion?: number): string {
        if (!/^[0-9A-Fa-f]{66}$/.test(publicKey)) {
            throw new PublicKeyError(publicKey);
        }

        if (!networkVersion) {
            networkVersion = configManager.get("network.pubKeyHash");
        }

        const buffer: Buffer = HashAlgorithms.ripemd160(Buffer.from(publicKey, "hex"));
        const payload: Buffer = Buffer.alloc(21);

        payload.writeUInt8(networkVersion, 0);
        buffer.copy(payload, 1);

        return Base58.encodeCheck(payload);
    }

    public static fromMultiSignatureAsset(asset: IMultiSignatureAsset, networkVersion?: number): string {
        return this.fromPublicKey(PublicKey.fromMultiSignatureAsset(asset), networkVersion);
    }

    public static fromPrivateKey(privateKey, networkVersion?: number): string {
        return Address.fromPublicKey(privateKey.publicKey, networkVersion);
    }

    public static validate(address: string, networkVersion?: number): boolean {
        if (!networkVersion) {
            networkVersion = configManager.get("network.pubKeyHash");
        }

        try {
            return Base58.decodeCheck(address)[0] === networkVersion;
        } catch (err) {
            return false;
        }
    }
}
