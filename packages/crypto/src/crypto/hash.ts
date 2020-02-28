import { secp256k1 } from "bcrypto";

import { IKeyPair } from "../interfaces";

export class Hash {
    public static signECDSA(hash: Buffer, keys: IKeyPair): string {
        return secp256k1.signatureExport(secp256k1.sign(hash, Buffer.from(keys.privateKey, "hex"))).toString("hex");
    }

    public static verifyECDSA(hash: Buffer, signature: Buffer | string, publicKey: Buffer | string): boolean {
        return secp256k1.verify(
            hash,
            secp256k1.signatureImport(signature instanceof Buffer ? signature : Buffer.from(signature, "hex")),
            publicKey instanceof Buffer ? publicKey : Buffer.from(publicKey, "hex"),
        );
    }

    public static signSchnorr(hash: Buffer, keys: IKeyPair): string {
        return secp256k1.schnorrSign(hash, Buffer.from(keys.privateKey, "hex")).toString("hex");
    }

    public static verifySchnorr(hash: Buffer, signature: Buffer | string, publicKey: Buffer | string): boolean {
        return secp256k1.schnorrVerify(
            hash,
            signature instanceof Buffer ? signature : Buffer.from(signature, "hex"),
            publicKey instanceof Buffer ? publicKey : Buffer.from(publicKey, "hex"),
        );
    }
}
