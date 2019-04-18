import secp256k1 from "secp256k1";
import { IKeyPair } from "../interfaces";

export class Hash {
    public static sign(hash: Buffer, keys: IKeyPair): string {
        return secp256k1
            .signatureExport(secp256k1.sign(hash, Buffer.from(keys.privateKey, "hex")).signature)
            .toString("hex");
    }

    public static verify(hash: Buffer, signature: Buffer | string, publicKey: Buffer | string): boolean {
        return secp256k1.verify(
            hash,
            secp256k1.signatureImport(signature instanceof Buffer ? signature : Buffer.from(signature, "hex")),
            publicKey instanceof Buffer ? publicKey : Buffer.from(publicKey, "hex"),
        );
    }
}
