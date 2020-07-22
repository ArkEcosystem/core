import { secp256k1 } from "bcrypto";
import { IKeyPair } from "../interfaces";

export class Hash {
    public static signECDSA(hash: Buffer, keys: IKeyPair): string {
        return secp256k1.signatureExport(secp256k1.sign(hash, Buffer.from(keys.privateKey, "hex"))).toString("hex");
    }

    public static verifyECDSA(hash: Buffer, signature: Buffer | string, publicKey: Buffer | string): boolean {
        const bufferSignature = signature instanceof Buffer ? signature : Buffer.from(signature, "hex");
        const signatureRS = secp256k1.signatureImport(bufferSignature);

        if (!secp256k1.isLowS(signatureRS)) {
            return false;
        }

        // check that global signature length matches R and S length, see DER format :
        // <header byte><signature length><integer marker><R length><R><integer marker><S length><S>
        const rLength = bufferSignature.readUInt8(3);
        const sLength = bufferSignature.readUInt8(4 + rLength + 1);
        if (bufferSignature.length !== 4 + rLength + 2 + sLength) {
            return false;
        }

        // check that first byte is positive, if it is then the whole R / S will be positive as required
        const rFirstByte = bufferSignature.readInt8(4);
        const sFirstByte = bufferSignature.readInt8(4 + rLength + 2);
        if (rFirstByte < 0 || sFirstByte < 0) {
            return false;
        }

        return secp256k1.verify(
            hash,
            signatureRS,
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
