"use strict";
// tslint:disable:no-bitwise
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Based on: https://github.com/bitcoinjs/bip38 @ 8e3a2cc6f7391782f3012129924a73bb632a3d4d
 */
const assert_1 = __importDefault(require("assert"));
const bcrypto_1 = require("bcrypto");
const browserify_aes_1 = __importDefault(require("browserify-aes"));
const inplace_1 = __importDefault(require("buffer-xor/inplace"));
const crypto_1 = __importDefault(require("crypto"));
const crypto_2 = require("../crypto");
const errors_1 = require("../errors");
const identities_1 = require("../identities");
const base58_1 = require("../utils/base58");
const SCRYPT_PARAMS = {
    N: 16384,
    r: 8,
    p: 8,
};
const NULL = Buffer.alloc(0);
const getPublicKey = (buffer, compressed) => {
    return Buffer.from(identities_1.Keys.fromPrivateKey(buffer, compressed).publicKey, "hex");
};
const getAddressPrivate = (privateKey, compressed) => {
    const publicKey = getPublicKey(privateKey, compressed);
    const buffer = crypto_2.HashAlgorithms.hash160(publicKey);
    const payload = Buffer.alloc(21);
    payload.writeUInt8(0x00, 0);
    buffer.copy(payload, 1);
    return base58_1.Base58.encodeCheck(payload);
};
exports.verify = (bip38) => {
    let decoded;
    try {
        decoded = base58_1.Base58.decodeCheck(bip38);
    }
    catch (_a) {
        return false;
    }
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
    }
    else if (type === 0x43) {
        if (flag & ~0x24) {
            return false;
        }
    }
    else {
        return false;
    }
    return true;
};
const encryptRaw = (buffer, compressed, passphrase) => {
    if (buffer.length !== 32) {
        throw new errors_1.PrivateKeyLengthError(32, buffer.length);
    }
    const address = getAddressPrivate(buffer, compressed);
    const secret = Buffer.from(passphrase, "utf8");
    const salt = crypto_2.HashAlgorithms.hash256(address).slice(0, 4);
    const scryptBuf = crypto_1.default.scryptSync(secret, salt, 64, SCRYPT_PARAMS);
    const derivedHalf1 = scryptBuf.slice(0, 32);
    const derivedHalf2 = scryptBuf.slice(32, 64);
    const xorBuf = inplace_1.default(derivedHalf1, buffer);
    const cipher = browserify_aes_1.default.createCipheriv("aes-256-ecb", derivedHalf2, NULL);
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
const decryptECMult = (buffer, passphrase) => {
    buffer = buffer.slice(1);
    const flag = buffer.readUInt8(1);
    const compressed = (flag & 0x20) !== 0;
    const hasLotSeq = (flag & 0x04) !== 0;
    assert_1.default.strictEqual(flag & 0x24, flag, "Invalid private key.");
    const addressHash = buffer.slice(2, 6);
    const ownerEntropy = buffer.slice(6, 14);
    let ownerSalt;
    // 4 bytes ownerSalt if 4 bytes lot/sequence
    if (hasLotSeq) {
        ownerSalt = ownerEntropy.slice(0, 4);
        // else, 8 bytes ownerSalt
    }
    else {
        ownerSalt = ownerEntropy;
    }
    const encryptedPart1 = buffer.slice(14, 22); // First 8 bytes
    const encryptedPart2 = buffer.slice(22, 38); // 16 bytes
    const preFactor = crypto_1.default.scryptSync(passphrase, ownerSalt, 32, SCRYPT_PARAMS);
    let passFactor;
    if (hasLotSeq) {
        const hashTarget = Buffer.concat([preFactor, ownerEntropy]);
        passFactor = crypto_2.HashAlgorithms.hash256(hashTarget);
    }
    else {
        passFactor = preFactor;
    }
    const publicKey = getPublicKey(passFactor, true);
    const seedBPass = crypto_1.default.scryptSync(publicKey, Buffer.concat([addressHash, ownerEntropy]), 64, {
        N: 1024,
        r: 1,
        p: 1,
    });
    const derivedHalf1 = seedBPass.slice(0, 32);
    const derivedHalf2 = seedBPass.slice(32, 64);
    const decipher = browserify_aes_1.default.createDecipheriv("aes-256-ecb", derivedHalf2, Buffer.alloc(0));
    decipher.setAutoPadding(false);
    decipher.end(encryptedPart2);
    const decryptedPart2 = decipher.read();
    const tmp = inplace_1.default(decryptedPart2, derivedHalf1.slice(16, 32));
    const seedBPart2 = tmp.slice(8, 16);
    const decipher2 = browserify_aes_1.default.createDecipheriv("aes-256-ecb", derivedHalf2, Buffer.alloc(0));
    decipher2.setAutoPadding(false);
    decipher2.write(encryptedPart1); // first 8 bytes
    decipher2.end(tmp.slice(0, 8)); // last 8 bytes
    const seedBPart1 = inplace_1.default(decipher2.read(), derivedHalf1.slice(0, 16));
    const seedB = Buffer.concat([seedBPart1, seedBPart2], 24);
    const privateKey = bcrypto_1.secp256k1.privateKeyTweakMul(crypto_2.HashAlgorithms.hash256(seedB), passFactor);
    return {
        privateKey,
        compressed,
    };
};
// some of the techniques borrowed from: https://github.com/pointbiz/bitaddress.org
const decryptRaw = (buffer, passphrase) => {
    // 39 bytes: 2 bytes prefix, 37 bytes payload
    if (buffer.length !== 39) {
        throw new errors_1.Bip38LengthError(39, buffer.length);
    }
    if (buffer.readUInt8(0) !== 0x01) {
        throw new errors_1.Bip38PrefixError(0x01, buffer.readUInt8(0));
    }
    // check if BIP38 EC multiply
    const type = buffer.readUInt8(1);
    if (type === 0x43) {
        return decryptECMult(buffer, passphrase);
    }
    if (type !== 0x42) {
        throw new errors_1.Bip38TypeError(0x42, type);
    }
    const flagByte = buffer.readUInt8(2);
    const compressed = flagByte === 0xe0;
    if (!compressed && flagByte !== 0xc0) {
        throw new errors_1.Bip38CompressionError(0xc0, flagByte);
    }
    const salt = buffer.slice(3, 7);
    const scryptBuf = crypto_1.default.scryptSync(passphrase, salt, 64, SCRYPT_PARAMS);
    const derivedHalf1 = scryptBuf.slice(0, 32);
    const derivedHalf2 = scryptBuf.slice(32, 64);
    const privKeyBuf = buffer.slice(7, 7 + 32);
    const decipher = browserify_aes_1.default.createDecipheriv("aes-256-ecb", derivedHalf2, NULL);
    decipher.setAutoPadding(false);
    decipher.end(privKeyBuf);
    const plainText = decipher.read();
    const privateKey = inplace_1.default(derivedHalf1, plainText);
    // verify salt matches address
    const address = getAddressPrivate(privateKey, compressed);
    const checksum = crypto_2.HashAlgorithms.hash256(address).slice(0, 4);
    assert_1.default.deepEqual(salt, checksum);
    return {
        privateKey,
        compressed,
    };
};
exports.encrypt = (privateKey, compressed, passphrase) => {
    return base58_1.Base58.encodeCheck(encryptRaw(privateKey, compressed, passphrase));
};
exports.decrypt = (bip38, passphrase) => {
    return decryptRaw(base58_1.Base58.decodeCheck(bip38), passphrase);
};
//# sourceMappingURL=bip38.js.map