/* tslint:disable:no-shadowed-variable */

import bs58check from "bs58check";
import ByteBuffer from "bytebuffer";
import crypto from "crypto";
import secp256k1 from "secp256k1";
import wif from "wif";

import { configManager } from "../managers/config";
import { feeManager } from "../managers/fee";
import { Bignum } from "../utils";
import { HashAlgorithms } from "./hash-algorithms";

const { transactionIdFixTable } = configManager.getPreset("mainnet").exceptions;

class Crypto {
    /**
     * Get transaction fee.
     * @param  {Transaction} transaction
     * @return {Number}
     */
    public getFee(transaction) {
        return feeManager.get(transaction.type);
    }

    /**
     * Get the byte representation of the transaction.
     * @param  {Transaction} transaction
     * @param  {Boolean} skipSignature
     * @param  {Boolean} skipSecondSignature
     * @return {String}
     */
    public getBytes(transaction, skipSignature = false, skipSecondSignature = false) {
        if (transaction.version && transaction.version !== 1) {
            throw new Error("not supported yet");
        }

        let assetSize = 0;
        let assetBytes = null;

        switch (transaction.type) {
            case 1: {
                // Signature
                const { signature } = transaction.asset;
                const bb = new ByteBuffer(33, true);
                const publicKeyBuffer = Buffer.from(signature.publicKey, "hex");

                for (const byte of publicKeyBuffer) {
                    bb.writeByte(byte);
                }

                bb.flip();

                assetBytes = new Uint8Array(bb.toArrayBuffer());
                assetSize = assetBytes.length;
                break;
            }

            case 2: {
                // Delegate
                assetBytes = Buffer.from(transaction.asset.delegate.username, "utf8");
                assetSize = assetBytes.length;
                break;
            }

            case 3: {
                // Vote
                if (transaction.asset.votes !== null) {
                    assetBytes = Buffer.from(transaction.asset.votes.join(""), "utf8");
                    assetSize = assetBytes.length;
                }
                break;
            }

            case 4: {
                // Multi-Signature
                const keysgroupBuffer = Buffer.from(transaction.asset.multisignature.keysgroup.join(""), "utf8");
                const bb = new ByteBuffer(1 + 1 + keysgroupBuffer.length, true);

                bb.writeByte(transaction.asset.multisignature.min);
                bb.writeByte(transaction.asset.multisignature.lifetime);

                for (const byte of keysgroupBuffer) {
                    bb.writeByte(byte);
                }

                bb.flip();

                assetBytes = bb.toBuffer();
                assetSize = assetBytes.length;
                break;
            }
        }

        const bb = new ByteBuffer(1 + 4 + 32 + 8 + 8 + 21 + 64 + 64 + 64 + assetSize, true);
        bb.writeByte(transaction.type);
        bb.writeInt(transaction.timestamp);

        const senderPublicKeyBuffer = Buffer.from(transaction.senderPublicKey, "hex");
        for (const byte of senderPublicKeyBuffer) {
            bb.writeByte(byte);
        }

        // Apply fix for broken type 1 and 4 transactions, which were
        // erroneously calculated with a recipient id.
        const isBrokenTransaction = Object.values(transactionIdFixTable).includes(transaction.id);
        const correctType = transaction.type !== 1 && transaction.type !== 4;
        if (transaction.recipientId && (isBrokenTransaction || correctType)) {
            const recipient = bs58check.decode(transaction.recipientId);
            for (const byte of recipient) {
                bb.writeByte(byte);
            }
        } else {
            for (let i = 0; i < 21; i++) {
                bb.writeByte(0);
            }
        }

        if (transaction.vendorFieldHex) {
            const vf = Buffer.from(transaction.vendorFieldHex, "hex");
            const fillstart = vf.length;
            for (let i = 0; i < fillstart; i++) {
                bb.writeByte(vf[i]);
            }
            for (let i = fillstart; i < 64; i++) {
                bb.writeByte(0);
            }
        } else if (transaction.vendorField) {
            const vf = Buffer.from(transaction.vendorField);
            const fillstart = vf.length;
            for (let i = 0; i < fillstart; i++) {
                bb.writeByte(vf[i]);
            }
            for (let i = fillstart; i < 64; i++) {
                bb.writeByte(0);
            }
        } else {
            for (let i = 0; i < 64; i++) {
                bb.writeByte(0);
            }
        }

        bb.writeInt64(+new Bignum(transaction.amount).toFixed());
        bb.writeInt64(+new Bignum(transaction.fee).toFixed());

        if (assetSize > 0) {
            for (let i = 0; i < assetSize; i++) {
                bb.writeByte(assetBytes[i]);
            }
        }

        if (!skipSignature && transaction.signature) {
            const signatureBuffer = Buffer.from(transaction.signature, "hex");
            for (const byte of signatureBuffer) {
                bb.writeByte(byte);
            }
        }

        if (!skipSecondSignature && transaction.signSignature) {
            const signSignatureBuffer = Buffer.from(transaction.signSignature, "hex");
            for (const byte of signSignatureBuffer) {
                bb.writeByte(byte);
            }
        }

        bb.flip();
        const arrayBuffer = new Uint8Array(bb.toArrayBuffer());
        const buffer = [];

        for (let i = 0; i < arrayBuffer.length; i++) {
            buffer[i] = arrayBuffer[i];
        }

        return Buffer.from(buffer);
    }

    /**
     * Get transaction id.
     * @param  {Transaction} transaction
     * @return {String}
     */
    public getId(transaction) {
        if (transaction.version && transaction.version !== 1) {
            throw new Error("not supported yet");
        }

        const bytes = this.getBytes(transaction);
        return crypto
            .createHash("sha256")
            .update(bytes)
            .digest()
            .toString("hex");

        // TODO: Enable AIP11 id here
    }

    /**
     * Get transaction hash.
     * @param  {Transaction} transaction
     * @return {Buffer}
     */
    public getHash(transaction, skipSignature = false, skipSecondSignature = false) {
        if (transaction.version && transaction.version !== 1) {
            throw new Error("not supported yet");
        }

        const bytes = this.getBytes(transaction, skipSignature, skipSecondSignature);
        return crypto
            .createHash("sha256")
            .update(bytes)
            .digest();

        // TODO: Enable AIP11 id here
    }

    /**
     * Sign transaction.
     * @param  {Transaction} transaction
     * @param  {Object}      keys
     * @return {Object}
     */
    public sign(transaction, keys) {
        let hash;
        if (!transaction.version || transaction.version === 1) {
            hash = this.getHash(transaction, true, true);
        } else {
            hash = this.getHash(transaction, false, false);
        }

        const signature = this.signHash(hash, keys);

        if (!transaction.signature) {
            transaction.signature = signature;
        }

        return signature;
    }

    /**
     * Sign transaction with second signature.
     * @param  {Transaction} transaction
     * @param  {Object}      keys
     * @return {Object}
     */
    public secondSign(transaction, keys) {
        const hash = this.getHash(transaction, false, true);
        const signature = this.signHash(hash, keys);

        if (!transaction.secondSignature) {
            transaction.secondSignature = signature;
        }

        return signature;
    }

    /**
     * Sign a hash
     * @param  {Buffer} hash
     * @param  {Object} keys
     * @return {String}
     */
    public signHash(hash, keys) {
        const { signature } = secp256k1.sign(hash, Buffer.from(keys.privateKey, "hex"));
        return secp256k1.signatureExport(signature).toString("hex");
    }

    /**
     * Verify transaction on the network.
     * @param  {Transaction}        transaction
     * @return {Boolean}
     */
    public verify(transaction) {
        if (transaction.version && transaction.version !== 1) {
            // TODO: enable AIP11 when ready here
            return false;
        }

        if (!transaction.signature) {
            return false;
        }

        const hash = this.getHash(transaction, true, true);
        return this.verifyHash(hash, transaction.signature, transaction.senderPublicKey);
    }

    /**
     * Verify second signature for transaction.
     * @param  {Transaction}        transaction
     * @param  {String}             publicKey
     * @return {Boolean}
     */
    public verifySecondSignature(transaction, publicKey) {
        let hash;
        let secondSignature;
        if (transaction.version && transaction.version !== 1) {
            hash = this.getHash(transaction);
            secondSignature = transaction.secondSignature;
        } else {
            hash = this.getHash(transaction, false, true);
            secondSignature = transaction.signSignature;
        }

        if (!secondSignature) {
            return false;
        }

        return this.verifyHash(hash, secondSignature, publicKey);
    }

    /**
     * Verify the hash.
     * @param  {Buffer} hash
     * @param  {(Buffer|String)} signature
     * @param  {(Buffer|String)} publicKey
     * @return {Boolean}
     */
    public verifyHash(hash, signature, publicKey) {
        signature = signature instanceof Buffer ? signature : Buffer.from(signature, "hex");
        publicKey = publicKey instanceof Buffer ? publicKey : Buffer.from(publicKey, "hex");
        return secp256k1.verify(hash, secp256k1.signatureImport(signature), publicKey);
    }

    /**
     * Get keys from secret.
     * @param  {String} secret
     * @param  {boolean} compressed
     * @return {Object}
     */
    public getKeys(secret, compressed = true) {
        const privateKey = HashAlgorithms.sha256(Buffer.from(secret, "utf8"));
        return this.getKeysByPrivateKey(privateKey, compressed);
    }

    /**
     * Get keys from a private key.
     * @param  {String|Buffer} privateKey
     * @param  {boolean} compressed
     * @return {Object}
     */
    public getKeysByPrivateKey(privateKey, compressed = true) {
        privateKey = privateKey instanceof Buffer ? privateKey : Buffer.from(privateKey, "hex");

        const publicKey = secp256k1.publicKeyCreate(privateKey, compressed);
        const keyPair = {
            publicKey: publicKey.toString("hex"),
            privateKey: privateKey.toString("hex"),
            compressed,
        };

        return keyPair;
    }

    /**
     * Get keys from WIF key.
     * @param  {String} wifKey
     * @param  {Object} network
     * @return {Object}
     */
    public getKeysFromWIF(wifKey, network?: any) {
        if (!network) {
            network = configManager.all();
        }

        // @ts-ignore
        const decoded = wif.decode(wifKey);
        const version = decoded.version;

        if (version !== network.wif) {
            throw new Error("Invalid network version");
        }

        const privateKey = decoded.privateKey;
        const publicKey = secp256k1.publicKeyCreate(privateKey, decoded.compressed);

        const keyPair = {
            publicKey: publicKey.toString("hex"),
            privateKey: privateKey.toString("hex"),
            compressed: decoded.compressed,
        };

        return keyPair;
    }

    /**
     * Get WIF key from keys
     * @param {Object} keys
     * @param {(Object|undefined)} network
     * @returns {String}
     */
    public keysToWIF(keys, network?: any) {
        if (!network) {
            network = configManager.all();
        }

        return wif.encode(network.wif, Buffer.from(keys.privateKey, "hex"), keys.compressed);
    }

    /**
     * Get address from public key.
     * @param  {String}             publicKey
     * @param  {(Number|undefined)} networkVersion
     * @return {String}
     */
    public getAddress(publicKey, networkVersion?) {
        const pubKeyRegex = /^[0-9A-Fa-f]{66}$/;
        if (!pubKeyRegex.test(publicKey)) {
            throw new Error(`publicKey '${publicKey}' is invalid`);
        }

        if (!networkVersion) {
            networkVersion = configManager.get("pubKeyHash");
        }

        const buffer = HashAlgorithms.ripemd160(Buffer.from(publicKey, "hex"));
        const payload = Buffer.alloc(21);

        payload.writeUInt8(networkVersion, 0);
        buffer.copy(payload, 1);

        return bs58check.encode(payload);
    }

    /**
     * Validate address.
     * @param  {String}             address
     * @param  {(Number|undefined)} networkVersion
     * @return {Boolean}
     */
    public validateAddress(address, networkVersion?: any) {
        if (!networkVersion) {
            networkVersion = configManager.get("pubKeyHash");
        }

        try {
            const decode = bs58check.decode(address);
            return decode[0] === networkVersion;
        } catch (e) {
            return false;
        }
    }

    /**
     * Validate public key.
     * @param  {String}             address
     * @param  {(Number|undefined)} networkVersion
     * @return {Boolean}
     */
    public validatePublicKey(address, networkVersion?: any) {
        if (!networkVersion) {
            networkVersion = configManager.get("pubKeyHash");
        }

        try {
            return this.getAddress(address, networkVersion).length === 34;
        } catch (e) {
            return false;
        }
    }
}

const arkCrypto = new Crypto();
export { arkCrypto as crypto };
