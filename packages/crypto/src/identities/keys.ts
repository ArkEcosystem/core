import { NetworkVersionError } from "../errors";
import { IKeyPair } from "../interfaces";

export class Keys {
    /**
     * TODO: consider passing methods through as one object
     * @param sha256
     * @param secp256k1
     * @param wif
     * @param version
     */
    public constructor(private sha256: any, private secp256k1: any, private wif: any, private version: number) {}

    // TODO: having a static method reimplement here is horrible, but it resolves a circular dependency
    public static fromPrivateKey(privateKey: Buffer | string, secp256k1: any, compressed = true): IKeyPair {
        return this.fromPrivateKey(privateKey, compressed, secp256k1);
    }

    public fromPassphrase(passphrase: string, compressed = true): IKeyPair {
        return this.fromPrivateKey(this.sha256(Buffer.from(passphrase, "utf8")), compressed);
    }

    public fromPrivateKey(privateKey: Buffer | string, compressed = true, secp256k1 = this.secp256k1): IKeyPair {
        privateKey = privateKey instanceof Buffer ? privateKey : Buffer.from(privateKey, "hex");

        return {
            publicKey: secp256k1.publicKeyCreate(privateKey, compressed).toString("hex"),
            privateKey: privateKey.toString("hex"),
            compressed,
        };
    }

    public fromWIF(wifKey: string): IKeyPair {
        const { version, compressed, privateKey } = this.wif.decode(wifKey, this.version);

        // TODO: I think check was probably left over from when this was instance based - can we remove?
        if (version !== this.version) {
            throw new NetworkVersionError(this.version, version);
        }

        return {
            publicKey: this.secp256k1.publicKeyCreate(privateKey, compressed).toString("hex"),
            privateKey: privateKey.toString("hex"),
            compressed,
        };
    }
}
