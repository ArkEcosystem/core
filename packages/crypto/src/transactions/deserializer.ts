import { TransactionType, TransactionTypeGroup } from "../enums";
import {
    DuplicateParticipantInMultiSignatureError,
    InvalidTransactionBytesError,
    TransactionVersionError,
} from "../errors";
import { Address } from "../identities";
import { IDeserializeOptions, ITransaction, ITransactionData } from "../interfaces";
import { BigNumber, ByteBuffer, isSupportedTransactionVersion } from "../utils";
import { TransactionTypeFactory } from "./types";

// Reference: https://github.com/ArkEcosystem/AIPs/blob/master/AIPS/aip-11.md
export class Deserializer {
    public static applyV1Compatibility(transaction: ITransactionData): void {
        transaction.secondSignature = transaction.secondSignature || transaction.signSignature;
        transaction.typeGroup = TransactionTypeGroup.Core;

        if (transaction.type === TransactionType.Vote && transaction.senderPublicKey) {
            transaction.recipientId = Address.fromPublicKey(transaction.senderPublicKey, transaction.network);
        } else if (
            transaction.type === TransactionType.MultiSignature &&
            transaction.asset &&
            transaction.asset.multiSignatureLegacy
        ) {
            transaction.asset.multiSignatureLegacy.keysgroup = transaction.asset.multiSignatureLegacy.keysgroup.map(
                (k) => (k.startsWith("+") ? k : `+${k}`),
            );
        }
    }

    public static deserialize(serialized: string | Buffer, options: IDeserializeOptions = {}): ITransaction {
        const data = {} as ITransactionData;

        const buff: ByteBuffer = this.getByteBuffer(serialized);
        this.deserializeCommon(data, buff);

        const instance: ITransaction = TransactionTypeFactory.create(data);
        this.deserializeVendorField(instance, buff);

        // Deserialize type specific parts
        instance.deserialize(buff);

        this.deserializeSignatures(data, buff);

        if (data.version) {
            if (
                options.acceptLegacyVersion ||
                options.disableVersionCheck ||
                isSupportedTransactionVersion(data.version)
            ) {
                if (data.version === 1) {
                    this.applyV1Compatibility(data);
                }
            } else {
                throw new TransactionVersionError(data.version);
            }
        }

        instance.serialized = buff.getResult();

        return instance;
    }

    public static deserializeCommon(transaction: ITransactionData, buf: ByteBuffer): void {
        // buf.skip(1); // Skip 0xFF marker
        buf.jump(1); // Skip 0xFF marker
        transaction.version = buf.readUInt8();
        transaction.network = buf.readUInt8();

        if (transaction.version === 1) {
            transaction.type = buf.readUInt8();
            transaction.timestamp = buf.readUInt32LE();
        } else {
            transaction.typeGroup = buf.readUInt32LE();
            transaction.type = buf.readUInt16LE();
            transaction.nonce = BigNumber.make(buf.readBigUInt64LE());
        }

        transaction.senderPublicKey = buf.readBuffer(33).toString("hex");
        transaction.fee = BigNumber.make(buf.readBigUInt64LE().toString());
        transaction.amount = BigNumber.ZERO;
    }

    private static deserializeVendorField(transaction: ITransaction, buf: ByteBuffer): void {
        const vendorFieldLength: number = buf.readUInt8();
        if (vendorFieldLength > 0) {
            if (transaction.hasVendorField()) {
                const vendorFieldBuffer: Buffer = buf.readBuffer(vendorFieldLength);
                transaction.data.vendorField = vendorFieldBuffer.toString("utf8");
            } else {
                buf.jump(vendorFieldLength);
            }
        }
    }

    private static deserializeSignatures(transaction: ITransactionData, buf: ByteBuffer): void {
        if (transaction.version === 1) {
            this.deserializeECDSA(transaction, buf);
        } else {
            this.deserializeSchnorrOrECDSA(transaction, buf);
        }
    }

    private static deserializeSchnorrOrECDSA(transaction: ITransactionData, buf: ByteBuffer): void {
        if (this.detectSchnorr(buf)) {
            this.deserializeSchnorr(transaction, buf);
        } else {
            this.deserializeECDSA(transaction, buf);
        }
    }

    private static deserializeECDSA(transaction: ITransactionData, buf: ByteBuffer): void {
        const currentSignatureLength = (): number => {
            buf.jump(1);
            const length = buf.readUInt8();

            buf.jump(-2);
            return length + 2;
        };

        // Signature
        if (buf.getRemainderLength()) {
            const signatureLength: number = currentSignatureLength();
            transaction.signature = buf.readBuffer(signatureLength).toString("hex");
        }

        const beginningMultiSignature = () => {
            const marker: number = buf.readUInt8();

            buf.jump(-1);

            return marker === 255;
        };

        // Second Signature
        if (buf.getRemainderLength() && !beginningMultiSignature()) {
            const secondSignatureLength: number = currentSignatureLength();
            transaction.secondSignature = buf.readBuffer(secondSignatureLength).toString("hex");
        }

        // Multi Signatures
        if (buf.getRemainderLength() && beginningMultiSignature()) {
            buf.jump(1);
            const multiSignature: string = buf.readBuffer(buf.getRemainderLength()).toString("hex");
            transaction.signatures = [multiSignature];
        }

        if (buf.getRemainderLength()) {
            throw new InvalidTransactionBytesError("signature buffer not exhausted");
        }
    }

    private static deserializeSchnorr(transaction: ITransactionData, buf: ByteBuffer): void {
        const canReadNonMultiSignature = () => {
            return (
                buf.getRemainderLength() && (buf.getRemainderLength() % 64 === 0 || buf.getRemainderLength() % 65 !== 0)
            );
        };

        if (canReadNonMultiSignature()) {
            transaction.signature = buf.readBuffer(64).toString("hex");
        }

        if (canReadNonMultiSignature()) {
            transaction.secondSignature = buf.readBuffer(64).toString("hex");
        }

        if (buf.getRemainderLength()) {
            if (buf.getRemainderLength() % 65 === 0) {
                transaction.signatures = [];

                const count: number = buf.getRemainderLength() / 65;
                const publicKeyIndexes: { [index: number]: boolean } = {};
                for (let i = 0; i < count; i++) {
                    const multiSignaturePart: string = buf.readBuffer(65).toString("hex");
                    const publicKeyIndex: number = parseInt(multiSignaturePart.slice(0, 2), 16);

                    if (!publicKeyIndexes[publicKeyIndex]) {
                        publicKeyIndexes[publicKeyIndex] = true;
                    } else {
                        throw new DuplicateParticipantInMultiSignatureError();
                    }

                    transaction.signatures.push(multiSignaturePart);
                }
            } else {
                throw new InvalidTransactionBytesError("signature buffer not exhausted");
            }
        }
    }

    private static detectSchnorr(buf: ByteBuffer): boolean {
        const remaining: number = buf.getRemainderLength();

        // `signature` / `secondSignature`
        if (remaining === 64 || remaining === 128) {
            return true;
        }

        // `signatures` of a multi signature transaction (type != 4)
        if (remaining % 65 === 0) {
            return true;
        }

        // only possiblity left is a type 4 transaction with and without a `secondSignature`.
        if ((remaining - 64) % 65 === 0 || (remaining - 128) % 65 === 0) {
            return true;
        }

        return false;
    }

    private static getByteBuffer(serialized: Buffer | string): ByteBuffer {
        if (!(serialized instanceof Buffer)) {
            serialized = Buffer.from(serialized, "hex");
        }

        return new ByteBuffer(serialized);
    }
}
