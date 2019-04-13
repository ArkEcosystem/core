import { secp256k1 } from "bcrypto";

const sign = (message: Buffer, key: Buffer): Buffer => {
    return secp256k1.schnorrSign(message, key);
};

const verify = (message: Buffer, signature: Buffer, key: Buffer): Buffer => {
    return secp256k1.schnorrVerify(message, signature, key);
};

export { sign, verify };
