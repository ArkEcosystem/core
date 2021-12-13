// @ts-nocheck

import { ByteBuffer } from "../byte-buffer";
import { TransactionType, TransactionTypeGroup } from "../enums";
import { TransactionVersionError } from "../errors";
import { Address } from "../identities";
import { ISerializeOptions } from "../interfaces";
import { ITransaction, ITransactionData } from "../interfaces";
import { configManager } from "../managers/config";
import { isException } from "../utils";
import { isSupportedTransactionVersion } from "../utils";
import { TransactionTypeFactory } from "./types";

// Reference: https://github.com/ArkEcosystem/AIPs/blob/master/AIPS/aip-11.md
export class Serializer {
    public static getBytes(transaction: ITransactionData, options: ISerializeOptions = {}): Buffer {
        const version: number = transaction.version || 1;

        if (options.acceptLegacyVersion || options.disableVersionCheck || isSupportedTransactionVersion(version)) {
            if (version === 1) {
                return this.getBytesV1(transaction, options);
            }

            return this.serialize(TransactionTypeFactory.create(transaction), options);
        } else {
            throw new TransactionVersionError(version);
        }
    }

    /**
     * Serializes the given transaction according to AIP11.
     */
    public static serialize(transaction: ITransaction, options: ISerializeOptions = {}): Buffer {
        const buffer: ByteBuffer = new ByteBuffer(Buffer.alloc(512));

        this.serializeCommon(transaction.data, buffer);
        this.serializeVendorField(transaction, buffer);

        const serialized: ByteBuffer | undefined = transaction.serialize(options);

        if (!serialized) {
            throw new Error();
        }

        // const typeBuffer: ByteBuffer = serialized.flip();
        // buffer.append(typeBuffer);
        buffer.writeBuffer(serialized.getResult());

        this.serializeSignatures(transaction.data, buffer, options);

        // const flippedBuffer: Buffer = buffer.flip().toBuffer();
        // transaction.serialized = flippedBuffer;
        const bufferBuffer = buffer.getResult();
        transaction.serialized = bufferBuffer;

        return bufferBuffer;
    }

    /**
     * Serializes the given transaction prior to AIP11 (legacy).
     */
    private static getBytesV1(transaction: ITransactionData, options: ISerializeOptions = {}): Buffer {
        let assetSize = 0;
        let assetBytes: Buffer | Uint8Array | undefined;

        if (transaction.type === TransactionType.SecondSignature && transaction.asset) {
            const { signature } = transaction.asset;
            // const bb = new ByteBuffer(33, true);
            const bytebuffer = new ByteBuffer(Buffer.alloc(33));

            if (signature && signature.publicKey) {
                // const publicKeyBuffer = Buffer.from(signature.publicKey, "hex");
                //
                // for (const byte of publRicKeyBuffer) {
                //     bb.writeByte(byte);
                // }
                bytebuffer.writeBuffer(Buffer.from(signature.publicKey, "hex"));
            }

            bytebuffer.flip();

            assetBytes = new Uint8Array(bytebuffer.toArrayBuffer());
            assetSize = assetBytes.length;
        }

        if (
            transaction.type === TransactionType.DelegateRegistration &&
            transaction.asset &&
            transaction.asset.delegate
        ) {
            assetBytes = Buffer.from(transaction.asset.delegate.username, "utf8");
            assetSize = assetBytes.length;
        }

        if (transaction.type === TransactionType.Vote && transaction.asset && transaction.asset.votes) {
            assetBytes = Buffer.from(transaction.asset.votes.join(""), "utf8");
            assetSize = assetBytes.length;
        }

        if (
            transaction.type === TransactionType.MultiSignature &&
            transaction.asset &&
            transaction.asset.multiSignatureLegacy
        ) {
            const keysgroupBuffer: Buffer = Buffer.from(
                transaction.asset.multiSignatureLegacy.keysgroup.join(""),
                "utf8",
            );
            const bb: ByteBuffer = new ByteBuffer(1 + 1 + keysgroupBuffer.length, true);

            bb.writeByte(transaction.asset.multiSignatureLegacy.min);
            bb.writeByte(transaction.asset.multiSignatureLegacy.lifetime);

            for (const byte of keysgroupBuffer) {
                bb.writeByte(byte);
            }

            bb.flip();

            assetBytes = bb.toBuffer();
            if (assetBytes) {
                assetSize = assetBytes.length;
            }
        }

        const bb: ByteBuffer = new ByteBuffer(Buffer.alloc(1 + 4 + 32 + 8 + 8 + 21 + 64 + 64 + 64 + assetSize));
        // bb.writeByte(transaction.type);
        // bb.writeInt(transaction.timestamp);

        bb.writeUInt8(transaction.type);
        bb.writeUInt32LE(transaction.timestamp);

        if (transaction.senderPublicKey) {
            // const senderPublicKeyBuffer: Buffer = Buffer.from(transaction.senderPublicKey, "hex");

            // for (const byte of senderPublicKeyBuffer) {
            //     bb.writeByte(byte);
            // }
            bb.writeBuffer(Buffer.from(transaction.senderPublicKey, "hex"));

            // Apply fix for broken type 1 and 4 transactions, which were
            // erroneously calculated with a recipient id.
            const { transactionIdFixTable } = configManager.get("exceptions");
            const isBrokenTransaction: boolean =
                transactionIdFixTable && Object.values(transactionIdFixTable).includes(transaction.id);

            if (isBrokenTransaction || (transaction.recipientId && transaction.type !== 1 && transaction.type !== 4)) {
                const recipientId =
                    transaction.recipientId || Address.fromPublicKey(transaction.senderPublicKey, transaction.network);
                // const recipient = Address.toBuffer(recipientId).addressBuffer;
                // for (const byte of recipient) {
                //     bb.writeByte(byte);
                // }
                bb.writeBuffer(Address.toBuffer(recipientId).addressBuffer);
            } else {
                for (let i = 0; i < 21; i++) {
                    // bb.writeByte(0);
                    bb.writeUInt8(0);
                }
            }
        }

        if (transaction.vendorField) {
            const vf: Buffer = Buffer.from(transaction.vendorField);
            const fillstart: number = vf.length;
            // for (let i = 0; i < fillstart; i++) {
            //     bb.writeByte(vf[i]);
            // }
            bb.writeBuffer(vf);

            for (let i = fillstart; i < 64; i++) {
                // bb.writeByte(0);
                bb.writeUInt8(0);
            }
            // const vf: Buffer = Buffer.from(transaction.vendorField);
            // const fillstart: number = vf.length;
            // for (let i = 0; i < fillstart; i++) {
            //     bb.writeByte(vf[i]);
            // }
            // for (let i = fillstart; i < 64; i++) {
            //     bb.writeByte(0);
            // }
        } else {
            for (let i = 0; i < 64; i++) {
                // bb.writeByte(0);
                bb.writeUInt8(0);
            }
        }

        // @ts-ignore - The ByteBuffer types say we can't use strings but the code actually handles them.
        // bb.writeInt64(transaction.amount.toString());
        bb.writeBigUInt64LE(transaction.amount.value);
        // @ts-ignore - The ByteBuffer types say we can't use strings but the code actually handles them.
        // bb.writeInt64(transaction.fee.toString());
        bb.writeBigUInt64LE(transaction.fee.value);

        if (assetSize > 0 && assetBytes) {
            for (let i = 0; i < assetSize; i++) {
                // bb.writeByte(assetBytes[i]);
                bb.writeUInt8(assetBytes[i]);
            }
        }

        if (!options.excludeSignature && transaction.signature) {
            // const signatureBuffer = Buffer.from(transaction.signature, "hex");
            // for (const byte of signatureBuffer) {
            //     bb.writeByte(byte);
            // }
            bb.writeBuffer(Buffer.from(transaction.signature, "hex"));
        }

        if (!options.excludeSecondSignature && transaction.secondSignature) {
            // const signSignatureBuffer = Buffer.from(transaction.secondSignature, "hex");
            // for (const byte of signSignatureBuffer) {
            //     bb.writeByte(byte);
            // }
            bb.writeBuffer(Buffer.from(transaction.secondSignature, "hex"));
        }

        // bb.flip();
        // const arrayBuffer: Uint8Array = new Uint8Array(bb.toArrayBuffer());
        // const buffer: number[] = [];
        //
        // for (let i = 0; i < arrayBuffer.length; i++) {
        //     buffer[i] = arrayBuffer[i];
        // }

        // return Buffer.from(buffer);
        return bb.getResult();
    }

    private static serializeCommon(transaction: ITransactionData, buffer: ByteBuffer): void {
        transaction.version = transaction.version || 0x01;
        if (transaction.typeGroup === undefined) {
            transaction.typeGroup = TransactionTypeGroup.Core;
        }

        // buffer.writeByte(0xff);
        // buffer.writeByte(transaction.version);
        // buffer.writeByte(transaction.network || configManager.get("network.pubKeyHash"));

        buffer.writeUInt8(0xff);
        buffer.writeUInt8(transaction.version);
        buffer.writeUInt8(transaction.network || configManager.get("network.pubKeyHash"));

        if (transaction.version === 1) {
            // buffer.writeByte(transaction.type);
            // buffer.writeUint32(transaction.timestamp);

            buffer.writeUInt8(transaction.type);
            buffer.writeUInt32LE(transaction.timestamp);
        } else {
            // buffer.writeUint32(transaction.typeGroup);
            // buffer.writeUint16(transaction.type);

            buffer.writeUInt32LE(transaction.typeGroup);
            buffer.writeUInt16LE(transaction.type);

            if (transaction.nonce) {
                // buffer.writeUint64(transaction.nonce.toString());
                // @ts-ignore
                buffer.writeBigInt64LE(transaction.nonce.value);
            }
        }

        if (transaction.senderPublicKey) {
            // buffer.append(transaction.senderPublicKey, "hex");
            buffer.writeBuffer(Buffer.from(transaction.senderPublicKey, "hex"));
        }

        // buffer.writeUint64(transaction.fee.toString());
        // @ts-ignore
        buffer.writeBigInt64LE(transaction.fee.value);
    }

    private static serializeVendorField(transaction: ITransaction, buffer: ByteBuffer): void {
        const { data }: ITransaction = transaction;

        if (transaction.hasVendorField() && data.vendorField) {
            const vf: Buffer = Buffer.from(data.vendorField, "utf8");
            // buffer.writeByte(vf.length);
            // buffer.append(vf);

            buffer.writeUInt8(vf.length);
            buffer.writeBuffer(vf);
        } else {
            // buffer.writeByte(0x00);
            buffer.writeUInt8(0x00);
        }
    }

    private static serializeSignatures(
        transaction: ITransactionData,
        buffer: ByteBuffer,
        options: ISerializeOptions = {},
    ): void {
        if (transaction.signature && !options.excludeSignature) {
            // buffer.append(transaction.signature, "hex");
            buffer.writeBuffer(Buffer.from(transaction.signature, "hex"));
        }

        const secondSignature: string | undefined = transaction.secondSignature || transaction.signSignature;

        if (secondSignature && !options.excludeSecondSignature) {
            // buffer.append(secondSignature, "hex");
            buffer.writeBuffer(Buffer.from(secondSignature, "hex"));
        }

        if (transaction.signatures) {
            if (transaction.version === 1 && isException(transaction)) {
                // buffer.append("ff", "hex"); // 0xff separator to signal start of multi-signature transactions
                // buffer.append(transaction.signatures.join(""), "hex");

                buffer.writeUInt8(0xff); // 0xff separator to signal start of multi-signature transactions
                buffer.writeBuffer(Buffer.from(transaction.signatures.join(""), "hex"));
            } else if (!options.excludeMultiSignature) {
                // buffer.append(transaction.signatures.join(""), "hex");
                buffer.writeBuffer(Buffer.from(transaction.signatures.join(""), "hex"));
            }
        }
    }
}
