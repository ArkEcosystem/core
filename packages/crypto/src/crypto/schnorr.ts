import { secp256k1 } from "bcrypto";

// TODO: with proper bcrypto typings we can get completely rid of our own secp256k1 dependency
export const signSchnorr = (message: Buffer, key: Buffer): Buffer => {
    return secp256k1.schnorrSign(message, key);
};

export const verifySchnorr = (message: Buffer, signature: Buffer, key: Buffer): boolean => {
    return secp256k1.schnorrVerify(message, signature, key);
};
