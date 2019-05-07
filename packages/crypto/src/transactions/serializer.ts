/* tslint:disable:no-shadowed-variable */

import bs58check from "bs58check";
import ByteBuffer from "bytebuffer";
import { Utils } from "..";
import { TransactionTypes } from "../enums";
import { TransactionVersionError } from "../errors";
import { Address } from "../identities";
import { ISerializeOptions } from "../interfaces";
import { ITransaction, ITransactionData } from "../interfaces";
import { configManager } from "../managers";
import { TransactionTypeFactory } from "./types";

// Reference: https://github.com/ArkEcosystem/AIPs/blob/master/AIPS/aip-11.md
export class Serializer {
    public static getBytes(transaction: ITransactionData, options?: ISerializeOptions): Buffer {
        const version: number = transaction.version || 1;

        if (version === 1) {
            return this.getBytesV1(transaction, options);
        } else if (version === 2 && configManager.getMilestone().aip11) {
            return this.getBytesV2(transaction, options);
        } else {
            throw new TransactionVersionError(version);
        }
    }

    /**
     * Serializes the given transaction according to AIP11.
     */
    public static serialize(transaction: ITransaction, options: ISerializeOptions = {}): Buffer {
        const buffer: ByteBuffer = new ByteBuffer(512, true);

        this.serializeCommon(transaction.data, buffer);
        this.serializeVendorField(transaction, buffer);

        const typeBuffer: ByteBuffer = transaction.serialize(options).flip();
        buffer.append(typeBuffer);

        this.serializeSignatures(transaction.data, buffer, options);

        const flippedBuffer: Buffer = buffer.flip().toBuffer();
        transaction.serialized = flippedBuffer;

        return flippedBuffer;
    }

    /**
     * Serializes the given transaction prior to AIP11 (legacy).
     */
    private static getBytesV1(transaction: ITransactionData, options: ISerializeOptions = {}): Buffer {
        let assetSize: number = 0;
        let assetBytes: Buffer | Uint8Array;

        switch (transaction.type) {
            case TransactionTypes.SecondSignature: {
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

            case TransactionTypes.DelegateRegistration:
            case TransactionTypes.DelegateResignation: {
                assetBytes = Buffer.from(transaction.asset.delegate.username, "utf8");
                assetSize = assetBytes.length;
                break;
            }

            case TransactionTypes.Vote: {
                if (transaction.asset.votes) {
                    assetBytes = Buffer.from(transaction.asset.votes.join(""), "utf8");
                    assetSize = assetBytes.length;
                }
                break;
            }

            case TransactionTypes.MultiSignature: {
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
                assetSize = assetBytes.length;
                break;
            }
        }

        const bb: ByteBuffer = new ByteBuffer(1 + 4 + 32 + 8 + 8 + 21 + 64 + 64 + 64 + assetSize, true);
        bb.writeByte(transaction.type);
        bb.writeInt(transaction.timestamp);

        const senderPublicKeyBuffer: Buffer = Buffer.from(transaction.senderPublicKey, "hex");
        for (const byte of senderPublicKeyBuffer) {
            bb.writeByte(byte);
        }

        // Apply fix for broken type 1 and 4 transactions, which were
        // erroneously calculated with a recipient id.
        const { transactionIdFixTable } = configManager.get("exceptions");
        const isBrokenTransaction: boolean =
            transactionIdFixTable && Object.values(transactionIdFixTable).includes(transaction.id);
        if (isBrokenTransaction || (transaction.recipientId && transaction.type !== 1 && transaction.type !== 4)) {
            const recipientId =
                transaction.recipientId || Address.fromPublicKey(transaction.senderPublicKey, transaction.network);
            const recipient = bs58check.decode(recipientId);
            for (const byte of recipient) {
                bb.writeByte(byte);
            }
        } else {
            for (let i = 0; i < 21; i++) {
                bb.writeByte(0);
            }
        }

        if (transaction.vendorFieldHex) {
            const vf: Buffer = Buffer.from(transaction.vendorFieldHex, "hex");
            const fillstart: number = vf.length;
            for (let i = 0; i < fillstart; i++) {
                bb.writeByte(vf[i]);
            }
            for (let i = fillstart; i < 64; i++) {
                bb.writeByte(0);
            }
        } else if (transaction.vendorField) {
            const vf: Buffer = Buffer.from(transaction.vendorField);
            const fillstart: number = vf.length;
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

        bb.writeInt64(+transaction.amount.toFixed());
        bb.writeInt64(+transaction.fee.toFixed());

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

        if (!options.excludeSecondSignature && transaction.secondSignature) {
            const signSignatureBuffer = Buffer.from(transaction.secondSignature, "hex");
            for (const byte of signSignatureBuffer) {
                bb.writeByte(byte);
            }
        }

        bb.flip();
        const arrayBuffer: Uint8Array = new Uint8Array(bb.toArrayBuffer());
        const buffer: number[] = [];

        for (let i = 0; i < arrayBuffer.length; i++) {
            buffer[i] = arrayBuffer[i];
        }

        return Buffer.from(buffer);
    }

    private static getBytesV2(transaction: ITransactionData, options: ISerializeOptions = {}): Buffer {
        return this.serialize(TransactionTypeFactory.create(transaction), options);
    }

    private static serializeCommon(transaction: ITransactionData, buffer: ByteBuffer): void {
        buffer.writeByte(0xff); // fill, to disambiguate from v1
        buffer.writeByte(transaction.version || 0x01); // version
        buffer.writeByte(transaction.network || configManager.get("network.pubKeyHash")); // ark = 0x17, devnet = 0x30
        buffer.writeByte(transaction.type);
        buffer.writeUint32(transaction.timestamp);
        buffer.append(transaction.senderPublicKey, "hex");
        buffer.writeUint64(+transaction.fee);
    }

    private static serializeVendorField(transaction: ITransaction, buffer: ByteBuffer): void {
        if (transaction.hasVendorField()) {
            const { data }: ITransaction = transaction;

            if (data.vendorField) {
                const vf: Buffer = Buffer.from(data.vendorField, "utf8");
                buffer.writeByte(vf.length);
                buffer.append(vf);
            } else if (data.vendorFieldHex) {
                buffer.writeByte(data.vendorFieldHex.length / 2);
                buffer.append(data.vendorFieldHex, "hex");
            } else {
                buffer.writeByte(0x00);
            }
        } else {
            buffer.writeByte(0x00);
        }
    }

    private static serializeSignatures(
        transaction: ITransactionData,
        buffer: ByteBuffer,
        options: ISerializeOptions = {},
    ): void {
        if (transaction.signature && !options.excludeSignature) {
            buffer.append(transaction.signature, "hex");
        }

        const secondSignature: string = transaction.secondSignature || transaction.signSignature;

        if (secondSignature && !options.excludeSecondSignature) {
            buffer.append(secondSignature, "hex");
        }

        if (transaction.signatures) {
            if (transaction.version === 1 && Utils.isException(transaction)) {
                buffer.append("ff", "hex"); // 0xff separator to signal start of multi-signature transactions
                buffer.append(transaction.signatures.join(""), "hex");
            } else if (!options.excludeMultiSignature) {
                buffer.append(transaction.signatures.join(""), "hex");
            }
        }
    }
}
