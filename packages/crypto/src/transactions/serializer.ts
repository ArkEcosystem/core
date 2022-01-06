import { TransactionType, TransactionTypeGroup } from "../enums";
import { TransactionVersionError } from "../errors";
import { Address } from "../identities";
import { ISerializeOptions } from "../interfaces";
import { ITransaction, ITransactionData } from "../interfaces";
import { configManager } from "../managers/config";
import { isException } from "../utils";
import { ByteBuffer, isSupportedTransactionVersion } from "../utils";
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
        const buff: ByteBuffer = new ByteBuffer(
            Buffer.alloc(configManager.getMilestone(configManager.getHeight()).block?.maxPayload ?? 8192),
        );

        this.serializeCommon(transaction.data, buff);
        this.serializeVendorField(transaction, buff);

        const serialized: ByteBuffer | undefined = transaction.serialize(options);

        if (!serialized) {
            throw new Error();
        }

        buff.writeBuffer(serialized.getResult());

        this.serializeSignatures(transaction.data, buff, options);

        const bufferBuffer = buff.getResult();
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
            const bb: ByteBuffer = new ByteBuffer(Buffer.alloc(1 + 1 + keysgroupBuffer.length));

            bb.writeUInt8(transaction.asset.multiSignatureLegacy.min);
            bb.writeUInt8(transaction.asset.multiSignatureLegacy.lifetime);

            for (const byte of keysgroupBuffer) {
                bb.writeUInt8(byte);
            }

            assetBytes = bb.getResult();
            assetSize = assetBytes.length;
        }

        const bb: ByteBuffer = new ByteBuffer(Buffer.alloc(1 + 4 + 32 + 8 + 8 + 21 + 255 + 64 + 64 + 64 + assetSize));

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

        bb.writeBigUInt64LE(transaction.amount.toBigInt());

        bb.writeBigUInt64LE(transaction.fee.toBigInt());

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

    private static serializeCommon(transaction: ITransactionData, buff: ByteBuffer): void {
        transaction.version = transaction.version || 0x01;
        if (transaction.typeGroup === undefined) {
            transaction.typeGroup = TransactionTypeGroup.Core;
        }

        buff.writeUInt8(0xff);
        buff.writeUInt8(transaction.version);
        buff.writeUInt8(transaction.network || configManager.get("network.pubKeyHash"));

        if (transaction.version === 1) {
            buff.writeUInt8(transaction.type);
            buff.writeUInt32LE(transaction.timestamp);
        } else {
            buff.writeUInt32LE(transaction.typeGroup);
            buff.writeUInt16LE(transaction.type);

            if (transaction.nonce) {
                buff.writeBigInt64LE(transaction.nonce.toBigInt());
            }
        }

        if (transaction.senderPublicKey) {
            buff.writeBuffer(Buffer.from(transaction.senderPublicKey, "hex"));
        }

        buff.writeBigInt64LE(transaction.fee.toBigInt());
    }

    private static serializeVendorField(transaction: ITransaction, buff: ByteBuffer): void {
        const { data }: ITransaction = transaction;

        if (transaction.hasVendorField() && data.vendorField) {
            const vf: Buffer = Buffer.from(data.vendorField, "utf8");
            buff.writeUInt8(vf.length);
            buff.writeBuffer(vf);
        } else {
            buff.writeUInt8(0x00);
        }
    }

    private static serializeSignatures(
        transaction: ITransactionData,
        buff: ByteBuffer,
        options: ISerializeOptions = {},
    ): void {
        if (transaction.signature && !options.excludeSignature) {
            buff.writeBuffer(Buffer.from(transaction.signature, "hex"));
        }

        const secondSignature: string | undefined = transaction.secondSignature || transaction.signSignature;

        if (secondSignature && !options.excludeSecondSignature) {
            buff.writeBuffer(Buffer.from(secondSignature, "hex"));
        }

        if (transaction.signatures) {
            if (transaction.version === 1 && isException(transaction)) {
                buff.writeUInt8(0xff); // 0xff separator to signal start of multi-signature transactions
                buff.writeBuffer(Buffer.from(transaction.signatures.join(""), "hex"));
            } else if (!options.excludeMultiSignature) {
                buff.writeBuffer(Buffer.from(transaction.signatures.join(""), "hex"));
            }
        }
    }
}
