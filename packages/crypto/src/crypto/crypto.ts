/* tslint:disable:no-shadowed-variable */

import bs58check from "bs58check";
import ByteBuffer from "bytebuffer";
import secp256k1 from "secp256k1";

import { TransactionVersionError } from "../errors";
import { Address, KeyPair, Keys, PublicKey, WIF } from "../identities";
import { configManager } from "../managers";
import { feeManager } from "../managers";
import { ITransactionData } from "../models";
import { Bignum } from "../utils";
import { HashAlgorithms } from "./hash-algorithms";

const { transactionIdFixTable } = configManager.getPreset("mainnet").exceptions;

class Crypto {
    /**
     * Get transaction fee.
     */
    public getFee(transaction: ITransactionData): number {
        return feeManager.get(transaction.type);
    }

    /**
     * Get the byte representation of the transaction.
     */
    public getBytes(
        transaction: ITransactionData,
        skipSignature: boolean = false,
        skipSecondSignature: boolean = false,
    ): Buffer {
        if (transaction.version && transaction.version !== 1) {
            throw new TransactionVersionError(transaction.version);
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
     */
    public getId(transaction: ITransactionData): string {
        if (transaction.version && transaction.version !== 1) {
            throw new TransactionVersionError(transaction.version);
        }

        return this.getHash(transaction).toString("hex");
    }

    /**
     * Get transaction hash.
     */
    public getHash(
        transaction: ITransactionData,
        skipSignature: boolean = false,
        skipSecondSignature: boolean = false,
    ): Buffer {
        if (transaction.version && transaction.version !== 1) {
            throw new TransactionVersionError(transaction.version);
        }

        const bytes = this.getBytes(transaction, skipSignature, skipSecondSignature);
        return HashAlgorithms.sha256(bytes);
    }

    /**
     * Sign transaction.
     */
    public sign(transaction: ITransactionData, keys: KeyPair): string {
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
     */
    public secondSign(transaction: ITransactionData, keys: KeyPair): string {
        const hash = this.getHash(transaction, false, true);
        const signature = this.signHash(hash, keys);

        if (!transaction.secondSignature) {
            transaction.secondSignature = signature;
        }

        return signature;
    }

    /**
     * Sign a hash
     */
    public signHash(hash: Buffer, keys: KeyPair): string {
        const { signature } = secp256k1.sign(hash, Buffer.from(keys.privateKey, "hex"));
        return secp256k1.signatureExport(signature).toString("hex");
    }

    /**
     * Verify transaction on the network.
     */
    public verify(transaction: ITransactionData): boolean {
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
     */
    public verifySecondSignature(transaction: ITransactionData, publicKey: string): boolean {
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
     */
    public verifyHash(hash: Buffer, signature: Buffer | string, publicKey: Buffer | string): boolean {
        signature = signature instanceof Buffer ? signature : Buffer.from(signature, "hex");
        publicKey = publicKey instanceof Buffer ? publicKey : Buffer.from(publicKey, "hex");
        return secp256k1.verify(hash, secp256k1.signatureImport(signature), publicKey);
    }

    /**
     * Get keys from secret.
     */
    public getKeys(secret: string, compressed: boolean = true): KeyPair {
        return Keys.fromPassphrase(secret, compressed);
    }

    /**
     * Get keys from a private key.
     */
    public getKeysByPrivateKey(privateKey: Buffer | string, compressed: boolean = true): KeyPair {
        privateKey = privateKey instanceof Buffer ? privateKey : Buffer.from(privateKey, "hex");
        return Keys.fromPrivateKey(privateKey, compressed);
    }

    /**
     * Get keys from WIF key.
     */
    public getKeysFromWIF(wifKey: string, network?: { wif: number }): KeyPair {
        return Keys.fromWIF(wifKey, network);
    }

    /**
     * Get WIF key from keys
     */
    public keysToWIF(keys: KeyPair, network?: { wif: number }): string {
        return WIF.fromKeys(keys, network);
    }

    /**
     * Get address from public key.
     */
    public getAddress(publicKey: string, networkVersion?: number): string {
        return Address.fromPublicKey(publicKey, networkVersion);
    }

    /**
     * Validate address.
     */
    public validateAddress(address: string, networkVersion?: number): boolean {
        return Address.validate(address, networkVersion);
    }

    /**
     * Validate public key.
     */
    public validatePublicKey(address: string, networkVersion?: number): boolean {
        return PublicKey.validate(address, networkVersion);
    }
}

export const crypto = new Crypto();
