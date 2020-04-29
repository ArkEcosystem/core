import { IKeyPair } from "../interfaces";
import { LibraryManager } from "../managers/library-manager";

export class Keys<T> {
    public constructor(private libraryManager: LibraryManager<T>, private version: number) {}

    public static fromPrivateKeyWithAlgorithm(privateKey, secp256k1, compressed = true): IKeyPair {
        privateKey = privateKey instanceof Buffer ? privateKey : Buffer.from(privateKey, "hex");

        return {
            publicKey: secp256k1.publicKeyCreate(privateKey, compressed).toString("hex"),
            privateKey: privateKey.toString("hex"),
            compressed,
        };
    }

    public fromPassphrase(passphrase: string, compressed = true): IKeyPair {
        return this.fromPrivateKey(
            this.libraryManager.Crypto.HashAlgorithms.sha256(Buffer.from(passphrase, "utf8")),
            compressed,
        );
    }

    public fromPrivateKey(privateKey: Buffer | string, compressed = true): IKeyPair {
        return Keys.fromPrivateKeyWithAlgorithm(privateKey, this.libraryManager.Libraries.secp256k1, compressed);
    }

    public fromWIF(wifKey: string): IKeyPair {
        const { compressed, privateKey } = this.libraryManager.Libraries.wif.decode(wifKey, this.version);

        return {
            publicKey: this.libraryManager.Libraries.secp256k1.publicKeyCreate(privateKey, compressed).toString("hex"),
            privateKey: privateKey.toString("hex"),
            compressed,
        };
    }
}
