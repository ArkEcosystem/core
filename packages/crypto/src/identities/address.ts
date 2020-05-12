import { Base58 } from "../crypto/base58";
import { HashAlgorithms } from "../crypto/hash-algorithms";
import { PublicKeyError } from "../errors";
import { IMultiSignatureAsset } from "../interfaces";
import { LibraryManager } from "../managers/library-manager";
import { PublicKey } from "./public-key";

export class Address<T> {
    private base58: Base58;
    private hashAlgorithms: HashAlgorithms;

    public constructor(
        libraryManager: LibraryManager<T>,
        private publicKey: PublicKey<T>,
        private networkVersion: number,
    ) {
        this.base58 = libraryManager.Crypto.Base58;
        this.hashAlgorithms = libraryManager.Crypto.HashAlgorithms;
    }

    public fromPassphrase(passphrase: string): string {
        return this.fromPublicKey(this.publicKey.fromPassphrase(passphrase));
    }

    public fromPublicKey(publicKey: string): string {
        if (!/^[0-9A-Fa-f]{66}$/.test(publicKey)) {
            throw new PublicKeyError(publicKey);
        }
        const buffer: Buffer = this.hashAlgorithms.ripemd160(Buffer.from(publicKey, "hex"));
        const payload: Buffer = Buffer.alloc(21);

        payload.writeUInt8(this.networkVersion, 0);
        buffer.copy(payload, 1);

        return this.fromBuffer(payload);
    }

    public fromWIF(wif: string): string {
        return this.fromPublicKey(this.publicKey.fromWIF(wif));
    }

    public fromMultiSignatureAsset(asset: IMultiSignatureAsset): string {
        return this.fromPublicKey(this.publicKey.fromMultiSignatureAsset(asset));
    }

    public fromPrivateKey(privateKey): string {
        return this.fromPublicKey(privateKey.publicKey);
    }

    public fromBuffer(buffer: Buffer): string {
        return this.base58.encodeCheck(buffer);
    }

    public toBuffer(address: string): { addressBuffer: Buffer; addressError?: string } {
        const buffer: Buffer = this.base58.decodeCheck(address);
        const result: { addressBuffer: Buffer; addressError?: string } = {
            addressBuffer: buffer,
        };

        if (buffer[0] !== this.networkVersion) {
            result.addressError = `Expected address network byte ${this.networkVersion}, but got ${buffer[0]}.`;
        }

        return result;
    }

    public validate(address: string): boolean {
        try {
            return this.base58.decodeCheck(address)[0] === this.networkVersion;
        } catch (err) {
            return false;
        }
    }
}
