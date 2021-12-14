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

        buffer.writeBuffer(serialized.getResult());

        this.serializeSignatures(transaction.data, buffer, options);

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
            const bytebuffer = new ByteBuffer(Buffer.alloc(33));

            if (signature && signature.publicKey) {
                bytebuffer.writeBuffer(Buffer.from(signature.publicKey, "hex"));
            }

            // bytebuffer.flip();
            // assetBytes = new Uint8Array(bytebuffer.getResult().toArrayBuffer());
            assetBytes = bytebuffer.getResult();
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

        bb.writeUInt8(transaction.type);
        bb.writeUInt32LE(transaction.timestamp);

        if (transaction.senderPublicKey) {
            bb.writeBuffer(Buffer.from(transaction.senderPublicKey, "hex"));

            // Apply fix for broken type 1 and 4 transactions, which were
            // erroneously calculated with a recipient id.
            const { transactionIdFixTable } = configManager.get("exceptions");
            const isBrokenTransaction: boolean =
                transactionIdFixTable && Object.values(transactionIdFixTable).includes(transaction.id);

            if (isBrokenTransaction || (transaction.recipientId && transaction.type !== 1 && transaction.type !== 4)) {
                const recipientId =
                    transaction.recipientId || Address.fromPublicKey(transaction.senderPublicKey, transaction.network);
                bb.writeBuffer(Address.toBuffer(recipientId).addressBuffer);
            } else {
                for (let i = 0; i < 21; i++) {
                    bb.writeUInt8(0);
                }
            }
        }

        if (transaction.vendorField) {
            const vf: Buffer = Buffer.from(transaction.vendorField);
            const fillstart: number = vf.length;
            bb.writeBuffer(vf);

            for (let i = fillstart; i < 64; i++) {
                bb.writeUInt8(0);
            }
        } else {
            for (let i = 0; i < 64; i++) {
                bb.writeUInt8(0);
            }
        }

        bb.writeBigUInt64LE(transaction.amount.value);

        bb.writeBigUInt64LE(transaction.fee.value);

        if (assetSize > 0 && assetBytes) {
            for (let i = 0; i < assetSize; i++) {
                bb.writeUInt8(assetBytes[i]);
            }
        }

        if (!options.excludeSignature && transaction.signature) {
            bb.writeBuffer(Buffer.from(transaction.signature, "hex"));
        }

        if (!options.excludeSecondSignature && transaction.secondSignature) {
            bb.writeBuffer(Buffer.from(transaction.secondSignature, "hex"));
        }

        return bb.getResult();
    }

    private static serializeCommon(transaction: ITransactionData, buffer: ByteBuffer): void {
        transaction.version = transaction.version || 0x01;
        if (transaction.typeGroup === undefined) {
            transaction.typeGroup = TransactionTypeGroup.Core;
        }

        buffer.writeUInt8(0xff);
        buffer.writeUInt8(transaction.version);
        buffer.writeUInt8(transaction.network || configManager.get("network.pubKeyHash"));

        if (transaction.version === 1) {
            buffer.writeUInt8(transaction.type);
            buffer.writeUInt32LE(transaction.timestamp);
        } else {
            buffer.writeUInt32LE(transaction.typeGroup);
            buffer.writeUInt16LE(transaction.type);

            if (transaction.nonce) {
                // @ts-ignore
                buffer.writeBigInt64LE(transaction.nonce.value);
            }
        }

        if (transaction.senderPublicKey) {
            buffer.writeBuffer(Buffer.from(transaction.senderPublicKey, "hex"));
        }

        // @ts-ignore
        buffer.writeBigInt64LE(transaction.fee.value);
    }

    private static serializeVendorField(transaction: ITransaction, buffer: ByteBuffer): void {
        const { data }: ITransaction = transaction;

        if (transaction.hasVendorField() && data.vendorField) {
            const vf: Buffer = Buffer.from(data.vendorField, "utf8");
            buffer.writeUInt8(vf.length);
            buffer.writeBuffer(vf);
        } else {
            buffer.writeUInt8(0x00);
        }
    }

    private static serializeSignatures(
        transaction: ITransactionData,
        buffer: ByteBuffer,
        options: ISerializeOptions = {},
    ): void {
        if (transaction.signature && !options.excludeSignature) {
            buffer.writeBuffer(Buffer.from(transaction.signature, "hex"));
        }

        const secondSignature: string | undefined = transaction.secondSignature || transaction.signSignature;

        if (secondSignature && !options.excludeSecondSignature) {
            buffer.writeBuffer(Buffer.from(secondSignature, "hex"));
        }

        if (transaction.signatures) {
            if (transaction.version === 1 && isException(transaction)) {
                buffer.writeUInt8(0xff); // 0xff separator to signal start of multi-signature transactions
                buffer.writeBuffer(Buffer.from(transaction.signatures.join(""), "hex"));
            } else if (!options.excludeMultiSignature) {
                buffer.writeBuffer(Buffer.from(transaction.signatures.join(""), "hex"));
            }
        }
    }
}
