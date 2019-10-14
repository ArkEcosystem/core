import { HashAlgorithms } from "../crypto";
import { PublicKeyError } from "../errors";
import { IMultiSignatureAsset } from "../interfaces";
import { configManager } from "../managers";
import { Base58 } from "../utils/base58";
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

        return this.fromBuffer(payload);
    }

    public static fromMultiSignatureAsset(asset: IMultiSignatureAsset, networkVersion?: number): string {
        return this.fromPublicKey(PublicKey.fromMultiSignatureAsset(asset), networkVersion);
    }

    public static fromPrivateKey(privateKey, networkVersion?: number): string {
        return Address.fromPublicKey(privateKey.publicKey, networkVersion);
    }

    public static fromBuffer(buffer: Buffer): string {
        return Base58.encodeCheck(buffer);
    }

    public static toBuffer(address: string): { addressBuffer: Buffer, addressError?: string } {
        const buffer: Buffer = Base58.decodeCheck(address);
        const networkVersion: number = configManager.get("network.pubKeyHash");
        const result: { addressBuffer: Buffer, addressError?: string } = {
            addressBuffer: buffer,
        }

        if (buffer[0] !== networkVersion) {
            result.addressError = `Expected address network byte ${networkVersion}, but got ${buffer[0]}.`
        }

        return result;
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
