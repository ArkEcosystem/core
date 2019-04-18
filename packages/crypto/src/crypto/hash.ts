import secp256k1 from "secp256k1";
import { IKeyPair } from "../interfaces";
import { signSchnorr, verifySchnorr } from "./schnorr";

export class Hash {
    public static signECDSA(hash: Buffer, keys: IKeyPair): string {
        return secp256k1
            .signatureExport(secp256k1.sign(hash, Buffer.from(keys.privateKey, "hex")).signature)
            .toString("hex");
    }

    public static verifyECDSA(hash: Buffer, signature: Buffer | string, publicKey: Buffer | string): boolean {
        return secp256k1.verify(
            hash,
            secp256k1.signatureImport(signature instanceof Buffer ? signature : Buffer.from(signature, "hex")),
            publicKey instanceof Buffer ? publicKey : Buffer.from(publicKey, "hex"),
        );
    }

    public static signSchnorr(hash: Buffer, keys: IKeyPair): string {
        return signSchnorr(hash, Buffer.from(keys.privateKey, "hex")).toString("hex");
    }

    public static verifySchnorr(hash: Buffer, signature: Buffer | string, publicKey: Buffer | string): boolean {
        return verifySchnorr(
            hash,
            signature instanceof Buffer ? signature : Buffer.from(signature, "hex"),
            publicKey instanceof Buffer ? publicKey : Buffer.from(publicKey, "hex"),
        );
    }
}
