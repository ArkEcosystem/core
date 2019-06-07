import { base58 } from "bstring";
import { HashAlgorithms } from "../crypto";
import { PublicKeyError } from "../errors";
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

        return this.encodeCheck(payload);
    }

    public static fromMultiSignatureAsset(asset: IMultiSignatureAsset, networkVersion?: number): string {
        return this.fromPublicKey(PublicKey.fromMultiSignatureAsset(asset), networkVersion);
    }

    public static fromPrivateKey(privateKey, networkVersion?: number): string {
        return Address.fromPublicKey(privateKey.publicKey, networkVersion);
    }

    public static encodeCheck(buffer: Buffer): string {
        const checksum: Buffer = HashAlgorithms.hash256(buffer);
        return base58.encode(Buffer.concat([buffer, checksum], buffer.length + 4));
    }

    public static decodeCheck(address: string): Buffer {
        const buffer: Buffer = base58.decode(address);
        const payload: Buffer = buffer.slice(0, -4);
        const checksum: Buffer = HashAlgorithms.hash256(payload);

        if (checksum.readUInt32LE(0) !== buffer.slice(-4).readUInt32LE(0)) {
            throw new Error("Invalid checksum");
        }

        return payload;
    }

    public static validate(address: string, networkVersion?: number): boolean {
        if (!networkVersion) {
            networkVersion = configManager.get("network.pubKeyHash");
        }

        try {
            return this.decodeCheck(address)[0] === networkVersion;
        } catch (err) {
            return false;
        }
    }
}
