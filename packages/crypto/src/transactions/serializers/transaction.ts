/* tslint:disable:no-shadowed-variable */

import bs58check from "bs58check";
import ByteBuffer from "bytebuffer";
import { TransactionTypes } from "../../constants";
import { TransactionTypeError, TransactionVersionError } from "../../errors";
import { configManager } from "../../managers";
import { Bignum } from "../../utils";
import { ITransactionData } from "../interfaces";
import { Transaction } from "../transaction";
import { AbstractTransaction } from "../types";

const { transactionIdFixTable } = configManager.getPreset("mainnet").exceptions;

export interface ISerializeOptions {
    excludeSignature?: boolean;
    excludeSecondSignature?: boolean;
}

// Reference: https://github.com/ArkEcosystem/AIPs/blob/master/AIPS/aip-11.md
export class TransactionSerializer {
    public static getBytes(transaction: ITransactionData, options?: ISerializeOptions): Buffer {
        const version = transaction.version || 1;

        switch (version) {
            case 1:
                return this.getBytesV1(transaction, options);
            default:
                throw new TransactionVersionError(version);
        }
    }

    /**
     * Serializes the given transaction according to AIP11.
     */
    public static serialize(transaction: ITransactionData): Buffer {
        const buffer = new ByteBuffer(512, true);

        this.serializeCommon(transaction, buffer);
        this.serializeVendorField(transaction, buffer);
        this.serializeType(transaction, buffer);
        this.serializeSignatures(transaction, buffer);

        return Buffer.from(buffer.flip().toBuffer());
    }

    public static serializeV2(transaction: AbstractTransaction): Buffer {
        const buffer = new ByteBuffer(512, true);
        const { data } = transaction;

        this.serializeCommon(data, buffer);
        this.serializeVendorField(data, buffer);

        // Type
        buffer.append(transaction.serialize());

        this.serializeSignatures(data, buffer);

        const flippedBuffer = Buffer.from(buffer.flip().toBuffer());
        transaction.serialized = flippedBuffer;

        return flippedBuffer;
    }

    /**
     * Serializes the given transaction prior to AIP11 (legacy).
     */
    private static getBytesV1(transaction: ITransactionData, options: ISerializeOptions = {}): Buffer {
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

        if (!options.excludeSignature && transaction.signature) {
            const signatureBuffer = Buffer.from(transaction.signature, "hex");
            for (const byte of signatureBuffer) {
                bb.writeByte(byte);
            }
        }

        if (!options.excludeSecondSignature && transaction.signSignature) {
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

    private static serializeCommon(transaction: ITransactionData, buffer: ByteBuffer): void {
        buffer.writeByte(0xff); // fill, to disambiguate from v1
        buffer.writeByte(transaction.version || 0x01); // version
        buffer.writeByte(transaction.network || configManager.get("pubKeyHash")); // ark = 0x17, devnet = 0x30
        buffer.writeByte(transaction.type);
        buffer.writeUint32(transaction.timestamp);
        buffer.append(transaction.senderPublicKey, "hex");
        buffer.writeUint64(+new Bignum(transaction.fee).toFixed());
    }

    private static serializeVendorField(transaction: ITransactionData, buffer: ByteBuffer): void {
        if (Transaction.canHaveVendorField(transaction.type)) {
            if (transaction.vendorField) {
                const vf = Buffer.from(transaction.vendorField, "utf8");
                buffer.writeByte(vf.length);
                buffer.append(vf);
            } else if (transaction.vendorFieldHex) {
                buffer.writeByte(transaction.vendorFieldHex.length / 2);
                buffer.append(transaction.vendorFieldHex, "hex");
            } else {
                buffer.writeByte(0x00);
            }
        } else {
            buffer.writeByte(0x00);
        }
    }

    private static serializeType(transaction: ITransactionData, buffer: ByteBuffer): void {
        if (transaction.type === TransactionTypes.Transfer) {
            this.serializeTransfer(transaction, buffer);
        } else if (transaction.type === TransactionTypes.SecondSignature) {
            this.serializeSecondSignature(transaction, buffer);
        } else if (transaction.type === TransactionTypes.DelegateRegistration) {
            this.serializeDelegateRegistration(transaction, buffer);
        } else if (transaction.type === TransactionTypes.Vote) {
            this.serializeVote(transaction, buffer);
        } else if (transaction.type === TransactionTypes.MultiSignature) {
            this.serializeMultiSignature(transaction, buffer);
        } else if (transaction.type === TransactionTypes.Ipfs) {
            this.serializeIpfs(transaction, buffer);
        } else if (transaction.type === TransactionTypes.TimelockTransfer) {
            this.serializeTimelockTransfer(transaction, buffer);
        } else if (transaction.type === TransactionTypes.MultiPayment) {
            this.serializeMultiPayment(transaction, buffer);
        } else if (transaction.type === TransactionTypes.DelegateResignation) {
            this.serializeDelegateResignation(transaction, buffer);
        } else {
            throw new TransactionTypeError(transaction.type);
        }
    }

    private static serializeTransfer(transaction: ITransactionData, buffer: ByteBuffer): void {
        buffer.writeUint64(+new Bignum(transaction.amount).toFixed());
        buffer.writeUint32(transaction.expiration || 0);
        buffer.append(bs58check.decode(transaction.recipientId));
    }

    private static serializeSecondSignature(transaction: ITransactionData, buffer: ByteBuffer): void {
        buffer.append(transaction.asset.signature.publicKey, "hex");
    }

    private static serializeDelegateRegistration(transaction: ITransactionData, buffer: ByteBuffer): void {
        const delegateBytes = Buffer.from(transaction.asset.delegate.username, "utf8");
        buffer.writeByte(delegateBytes.length);
        buffer.append(delegateBytes, "hex");
    }

    private static serializeVote(transaction: ITransactionData, buffer: ByteBuffer): void {
        const voteBytes = transaction.asset.votes.map(vote => (vote[0] === "+" ? "01" : "00") + vote.slice(1)).join("");
        buffer.writeByte(transaction.asset.votes.length);
        buffer.append(voteBytes, "hex");
    }

    private static serializeMultiSignature(transaction: ITransactionData, buffer: ByteBuffer): void {
        let joined = null;

        if (!transaction.version || transaction.version === 1) {
            joined = transaction.asset.multisignature.keysgroup.map(k => (k[0] === "+" ? k.slice(1) : k)).join("");
        } else {
            joined = transaction.asset.multisignature.keysgroup.join("");
        }

        const keysgroupBuffer = Buffer.from(joined, "hex");
        buffer.writeByte(transaction.asset.multisignature.min);
        buffer.writeByte(transaction.asset.multisignature.keysgroup.length);
        buffer.writeByte(transaction.asset.multisignature.lifetime);
        buffer.append(keysgroupBuffer, "hex");
    }

    private static serializeIpfs(transaction: ITransactionData, buffer: ByteBuffer): void {
        buffer.writeByte(transaction.asset.ipfs.dag.length / 2);
        buffer.append(transaction.asset.ipfs.dag, "hex");
    }

    private static serializeTimelockTransfer(transaction: ITransactionData, buffer: ByteBuffer): void {
        buffer.writeUint64(+new Bignum(transaction.amount).toFixed());
        buffer.writeByte(transaction.timelockType);
        buffer.writeUint64(transaction.timelock);
        buffer.append(bs58check.decode(transaction.recipientId));
    }

    private static serializeMultiPayment(transaction: ITransactionData, buffer: ByteBuffer): void {
        buffer.writeUint32(transaction.asset.payments.length);
        transaction.asset.payments.forEach(p => {
            buffer.writeUint64(+new Bignum(p.amount).toFixed());
            buffer.append(bs58check.decode(p.recipientId));
        });
    }

    private static serializeDelegateResignation(transaction: ITransactionData, buffer: ByteBuffer): void {
        return;
    }

    private static serializeSignatures(transaction: ITransactionData, buffer: ByteBuffer): void {
        if (transaction.signature) {
            buffer.append(transaction.signature, "hex");
        }

        if (transaction.secondSignature) {
            buffer.append(transaction.secondSignature, "hex");
        } else if (transaction.signSignature) {
            buffer.append(transaction.signSignature, "hex");
        }

        if (transaction.signatures) {
            buffer.append("ff", "hex"); // 0xff separator to signal start of multi-signature transactions
            buffer.append(transaction.signatures.join(""), "hex");
        }
    }
}
