// tslint:disable:no-bitwise

/**
 * Based on: https://github.com/bitcoinjs/bip38 @ 8e3a2cc6f7391782f3012129924a73bb632a3d4d
 */

import assert from "assert";
import { secp256k1 } from "bcrypto";
import aes from "browserify-aes";
import bs58check from "bs58check";
import xor from "buffer-xor/inplace";
import crypto from "crypto";
import { HashAlgorithms } from "../crypto";
import {
    Bip38CompressionError,
    Bip38LengthError,
    Bip38PrefixError,
    Bip38TypeError,
    PrivateKeyLengthError,
} from "../errors";
import { Keys } from "../identities";
import { IDecryptResult } from "../interfaces";

const SCRYPT_PARAMS = {
    N: 16384, // specified by BIP38
    r: 8,
    p: 8,
};
const NULL = Buffer.alloc(0);

const getPublicKey = (buffer: Buffer, compressed: boolean): Buffer => {
    return Buffer.from(Keys.fromPrivateKey(buffer, compressed).publicKey, "hex");
};

const getAddressPrivate = (privateKey: Buffer, compressed: boolean): string => {
    const publicKey = getPublicKey(privateKey, compressed);
    const buffer = HashAlgorithms.hash160(publicKey);
    const payload = Buffer.alloc(21);

    payload.writeUInt8(0x00, 0);
    buffer.copy(payload, 1);

    return bs58check.encode(payload);
};

export const verify = (bip38: string): boolean => {
    const decoded = bs58check.decodeUnsafe(bip38);
    if (!decoded) {
        return false;
    }

    if (decoded.length !== 39) {
        return false;
    }
    if (decoded.readUInt8(0) !== 0x01) {
        return false;
    }

    const type = decoded.readUInt8(1);
    const flag = decoded.readUInt8(2);

    // encrypted WIF
    if (type === 0x42) {
        if (flag !== 0xc0 && flag !== 0xe0) {
            return false;
        }

        // EC mult
    } else if (type === 0x43) {
        if (flag & ~0x24) {
            return false;
        }
    } else {
        return false;
    }

    return true;
};

const encryptRaw = (buffer: Buffer, compressed: boolean, passphrase: string): Buffer => {
    if (buffer.length !== 32) {
        throw new PrivateKeyLengthError(32, buffer.length);
    }

    const address = getAddressPrivate(buffer, compressed);

    const secret = Buffer.from(passphrase, "utf8");
    const salt = HashAlgorithms.hash256(address).slice(0, 4);

    const scryptBuf = crypto.scryptSync(secret, salt, 64, SCRYPT_PARAMS);
    const derivedHalf1 = scryptBuf.slice(0, 32);
    const derivedHalf2 = scryptBuf.slice(32, 64);

    const xorBuf = xor(derivedHalf1, buffer);
    const cipher = aes.createCipheriv("aes-256-ecb", derivedHalf2, NULL);
    cipher.setAutoPadding(false);
    cipher.end(xorBuf);

    const cipherText = cipher.read();

    // 0x01 | 0x42 | flagByte | salt (4) | cipherText (32)
    const result = Buffer.allocUnsafe(7 + 32);
    result.writeUInt8(0x01, 0);
    result.writeUInt8(0x42, 1);
    result.writeUInt8(compressed ? 0xe0 : 0xc0, 2);
    salt.copy(result, 3);
    cipherText.copy(result, 7);

    return result;
};

const decryptECMult = (buffer: Buffer, passphrase: string): IDecryptResult => {
    buffer = buffer.slice(1); // FIXME: we can avoid this

    const flag = buffer.readUInt8(1);

    const compressed = (flag & 0x20) !== 0;
    const hasLotSeq = (flag & 0x04) !== 0;

    assert.equal(flag & 0x24, flag, "Invalid private key.");

    const addressHash = buffer.slice(2, 6);
    const ownerEntropy = buffer.slice(6, 14);
    let ownerSalt;

    // 4 bytes ownerSalt if 4 bytes lot/sequence
    if (hasLotSeq) {
        ownerSalt = ownerEntropy.slice(0, 4);

        // else, 8 bytes ownerSalt
    } else {
        ownerSalt = ownerEntropy;
    }

    const encryptedPart1 = buffer.slice(14, 22); // First 8 bytes
    const encryptedPart2 = buffer.slice(22, 38); // 16 bytes

    const preFactor = crypto.scryptSync(passphrase, ownerSalt, 32, SCRYPT_PARAMS);

    let passFactor;
    if (hasLotSeq) {
        const hashTarget = Buffer.concat([preFactor, ownerEntropy]);
        passFactor = HashAlgorithms.hash256(hashTarget);
    } else {
        passFactor = preFactor;
    }

    const publicKey = getPublicKey(passFactor, true);
    const seedBPass = crypto.scryptSync(publicKey, Buffer.concat([addressHash, ownerEntropy]), 64, {
        N: 1024,
        r: 1,
        p: 1,
    });
    const derivedHalf1 = seedBPass.slice(0, 32);
    const derivedHalf2 = seedBPass.slice(32, 64);

    const decipher = aes.createDecipheriv("aes-256-ecb", derivedHalf2, Buffer.alloc(0));
    decipher.setAutoPadding(false);
    decipher.end(encryptedPart2);

    const decryptedPart2 = decipher.read();
    const tmp = xor(decryptedPart2, derivedHalf1.slice(16, 32));
    const seedBPart2 = tmp.slice(8, 16);

    const decipher2 = aes.createDecipheriv("aes-256-ecb", derivedHalf2, Buffer.alloc(0));
    decipher2.setAutoPadding(false);
    decipher2.write(encryptedPart1); // first 8 bytes
    decipher2.end(tmp.slice(0, 8)); // last 8 bytes

    const seedBPart1 = xor(decipher2.read(), derivedHalf1.slice(0, 16));
    const seedB = Buffer.concat([seedBPart1, seedBPart2], 24);
    const privateKey = secp256k1.privateKeyTweakMul(HashAlgorithms.hash256(seedB), passFactor);

    return {
        privateKey,
        compressed,
    };
};

// some of the techniques borrowed from: https://github.com/pointbiz/bitaddress.org
const decryptRaw = (buffer: Buffer, passphrase: string): IDecryptResult => {
    // 39 bytes: 2 bytes prefix, 37 bytes payload
    if (buffer.length !== 39) {
        throw new Bip38LengthError(39, buffer.length);
    }
    if (buffer.readUInt8(0) !== 0x01) {
        throw new Bip38PrefixError(0x01, buffer.readUInt8(0));
    }

    // check if BIP38 EC multiply
    const type = buffer.readUInt8(1);
    if (type === 0x43) {
        return decryptECMult(buffer, passphrase);
    }
    if (type !== 0x42) {
        throw new Bip38TypeError(0x42, type);
    }

    const flagByte = buffer.readUInt8(2);
    const compressed = flagByte === 0xe0;
    if (!compressed && flagByte !== 0xc0) {
        throw new Bip38CompressionError(0xc0, flagByte);
    }

    const salt = buffer.slice(3, 7);
    const scryptBuf = crypto.scryptSync(passphrase, salt, 64, SCRYPT_PARAMS);
    const derivedHalf1 = scryptBuf.slice(0, 32);
    const derivedHalf2 = scryptBuf.slice(32, 64);

    const privKeyBuf = buffer.slice(7, 7 + 32);
    const decipher = aes.createDecipheriv("aes-256-ecb", derivedHalf2, NULL);
    decipher.setAutoPadding(false);
    decipher.end(privKeyBuf);

    const plainText = decipher.read();
    const privateKey = xor(derivedHalf1, plainText);

    // verify salt matches address
    const address = getAddressPrivate(privateKey, compressed);

    const checksum = HashAlgorithms.hash256(address).slice(0, 4);
    assert.deepEqual(salt, checksum);

    return {
        privateKey,
        compressed,
    };
};

export const encrypt = (privateKey: Buffer, compressed: boolean, passphrase: string): string => {
    return bs58check.encode(encryptRaw(privateKey, compressed, passphrase));
};

export const decrypt = (bip38: string, passphrase): IDecryptResult => {
    return decryptRaw(bs58check.decode(bip38), passphrase);
};
