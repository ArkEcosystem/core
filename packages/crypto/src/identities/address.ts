import bs58check from "bs58check";
import { Utils } from "..";
import { HashAlgorithms } from "../crypto";
import { InvalidMultiSignatureAssetError, PublicKeyError } from "../errors";
import { IMultiSignatureAsset } from "../interfaces";
import { configManager } from "../managers";
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

        return bs58check.encode(payload);
    }

    public static fromMultiSignatureAsset(asset: IMultiSignatureAsset, networkVersion?: number): string {
        const { min, publicKeys } = asset;
        publicKeys.forEach(publicKey => {
            if (!/^[0-9A-Fa-f]{66}$/.test(publicKey)) {
                throw new PublicKeyError(publicKey);
            }
        });

        if (min < 1 || min > publicKeys.length) {
            throw new InvalidMultiSignatureAssetError();
        }

        networkVersion = networkVersion || configManager.get("network.pubKeyHash");

        const keyBuffers = publicKeys.map(publicKey => Buffer.from(publicKey, "hex"));

        const hash = HashAlgorithms.ripemd160(
            Buffer.concat([Buffer.from(Utils.numberToHex(min), "hex"), ...keyBuffers]),
        );

        const payload: Buffer = Buffer.alloc(21);
        payload.writeUInt8(networkVersion, 0);
        hash.copy(payload, 1);

        return bs58check.encode(payload);
    }

    public static fromPrivateKey(privateKey, networkVersion?: number): string {
        return Address.fromPublicKey(privateKey.publicKey, networkVersion);
    }

    public static validate(address: string, networkVersion?: number): boolean {
        if (!networkVersion) {
            networkVersion = configManager.get("network.pubKeyHash");
        }

        try {
            return bs58check.decode(address)[0] === networkVersion;
        } catch (err) {
            return false;
        }
    }
}
