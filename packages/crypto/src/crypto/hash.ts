import { IKeyPair } from "../interfaces";
import { Libraries } from "./interfaces";

export class Hash {
    private secp256k1: any;

    public constructor(libraries: Libraries) {
        this.secp256k1 = libraries.secp256k1;
    }

    public signECDSA(hash: Buffer, keys: IKeyPair): string {
        return this.secp256k1
            .signatureExport(this.secp256k1.sign(hash, Buffer.from(keys.privateKey, "hex")))
            .toString("hex");
    }

    public verifyECDSA(hash: Buffer, signature: Buffer | string, publicKey: Buffer | string): boolean {
        return this.secp256k1.verify(
            hash,
            this.secp256k1.signatureImport(signature instanceof Buffer ? signature : Buffer.from(signature, "hex")),
            publicKey instanceof Buffer ? publicKey : Buffer.from(publicKey, "hex"),
        );
    }

    public signSchnorr(hash: Buffer, keys: IKeyPair): string {
        return this.secp256k1.schnorrSign(hash, Buffer.from(keys.privateKey, "hex")).toString("hex");
    }

    public verifySchnorr(hash: Buffer, signature: Buffer | string, publicKey: Buffer | string): boolean {
        return this.secp256k1.schnorrVerify(
            hash,
            signature instanceof Buffer ? signature : Buffer.from(signature, "hex"),
            publicKey instanceof Buffer ? publicKey : Buffer.from(publicKey, "hex"),
        );
    }
}
