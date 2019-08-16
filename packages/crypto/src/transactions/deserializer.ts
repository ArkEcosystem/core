import ByteBuffer from "bytebuffer";
import { TransactionType, TransactionTypeGroup } from "../enums";
import { MalformedTransactionBytesError, TransactionVersionError } from "../errors";
import { Address } from "../identities";
import { ITransaction, ITransactionData } from "../interfaces";
import { BigNumber, isSupportedTansactionVersion } from "../utils";
import { TransactionTypeFactory } from "./types";

// Reference: https://github.com/ArkEcosystem/AIPs/blob/master/AIPS/aip-11.md
class Deserializer {
    public deserialize(serialized: string | Buffer): ITransaction {
        const data = {} as ITransactionData;

        const buffer: ByteBuffer = this.getByteBuffer(serialized);
        this.deserializeCommon(data, buffer);

        const instance: ITransaction = TransactionTypeFactory.create(data);
        this.deserializeVendorField(instance, buffer);

        // Deserialize type specific parts
        instance.deserialize(buffer);

        this.deserializeSignatures(data, buffer);

        if (isSupportedTansactionVersion(data.version)) {
            if (data.version === 1) {
                this.applyV1Compatibility(data);
            }
        } else {
            throw new TransactionVersionError(data.version);
        }

        instance.serialized = buffer.flip().toBuffer();

        return instance;
    }

    private deserializeCommon(transaction: ITransactionData, buf: ByteBuffer): void {
        buf.skip(1); // Skip 0xFF marker
        transaction.version = buf.readUint8();
        transaction.network = buf.readUint8();

        if (transaction.version === 1) {
            transaction.type = buf.readUint8();
            transaction.timestamp = buf.readUint32();
        } else {
            transaction.typeGroup = buf.readUint32();
            transaction.type = buf.readUint16();
            transaction.nonce = BigNumber.make(buf.readUint64().toString());
        }

        transaction.senderPublicKey = buf.readBytes(33).toString("hex");
        transaction.fee = BigNumber.make(buf.readUint64().toString());
        transaction.amount = BigNumber.ZERO;
    }

    private deserializeVendorField(transaction: ITransaction, buf: ByteBuffer): void {
        const vendorFieldLength: number = buf.readUint8();
        if (vendorFieldLength > 0) {
            if (transaction.hasVendorField()) {
                const vendorFieldBuffer: Buffer = buf.readBytes(vendorFieldLength).toBuffer();
                transaction.data.vendorFieldHex = vendorFieldBuffer.toString("hex"); // TODO: purpose?
                transaction.data.vendorField = vendorFieldBuffer.toString("utf8");
            } else {
                buf.skip(vendorFieldLength);
            }
        }
    }

    private deserializeSignatures(transaction: ITransactionData, buf: ByteBuffer): void {
        if (transaction.version === 1) {
            this.deserializeECDSA(transaction, buf);
        } else {
            this.deserializeSchnorrOrECDSA(transaction, buf);
        }
    }

    private deserializeSchnorrOrECDSA(transaction: ITransactionData, buf: ByteBuffer): void {
        if (this.detectSchnorr(buf)) {
            this.deserializeSchnorr(transaction, buf);
        } else {
            this.deserializeECDSA(transaction, buf);
        }
    }

    private deserializeECDSA(transaction: ITransactionData, buf: ByteBuffer): void {
        const currentSignatureLength = (): number => {
            buf.mark();

            const lengthHex: string = buf
                .skip(1)
                .readBytes(1)
                .toString("hex");

            buf.reset();
            return parseInt(lengthHex, 16) + 2;
        };

        // Signature
        if (buf.remaining()) {
            const signatureLength: number = currentSignatureLength();
            transaction.signature = buf.readBytes(signatureLength).toString("hex");
        }

        const beginningMultiSignature = () => {
            buf.mark();

            const marker: number = buf.readUint8();

            buf.reset();

            return marker === 255;
        };

        // Second Signature
        if (buf.remaining() && !beginningMultiSignature()) {
            const secondSignatureLength: number = currentSignatureLength();
            transaction.secondSignature = buf.readBytes(secondSignatureLength).toString("hex");
        }

        // Multi Signatures
        if (buf.remaining() && beginningMultiSignature()) {
            buf.skip(1);
            const multiSignature: string = buf.readBytes(buf.limit - buf.offset).toString("hex");
            transaction.signatures = [multiSignature];
        }

        if (buf.remaining()) {
            throw new MalformedTransactionBytesError();
        }
    }

    private deserializeSchnorr(transaction: ITransactionData, buf: ByteBuffer): void {
        const canReadNonMultiSignature = () => {
            return buf.remaining() && (buf.remaining() % 64 === 0 || buf.remaining() % 65 !== 0);
        };

        if (canReadNonMultiSignature()) {
            transaction.signature = buf.readBytes(64).toString("hex");
        }

        if (canReadNonMultiSignature()) {
            transaction.secondSignature = buf.readBytes(64).toString("hex");
        }

        if (buf.remaining()) {
            if (buf.remaining() % 65 === 0) {
                transaction.signatures = [];

                const count = buf.remaining() / 65;
                for (let i = 0; i < count; i++) {
                    const multiSignaturePart = buf.readBytes(65).toString("hex");
                    transaction.signatures.push(multiSignaturePart);
                }
            } else {
                throw new MalformedTransactionBytesError();
            }
        }
    }

    private detectSchnorr(buf: ByteBuffer): boolean {
        const remaining: number = buf.remaining();

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

    // tslint:disable-next-line:member-ordering
    public applyV1Compatibility(transaction: ITransactionData): void {
        transaction.secondSignature = transaction.secondSignature || transaction.signSignature;
        transaction.typeGroup = TransactionTypeGroup.Core;

        if (transaction.type === TransactionType.Vote) {
            transaction.recipientId = Address.fromPublicKey(transaction.senderPublicKey, transaction.network);
        } else if (transaction.type === TransactionType.MultiSignature) {
            transaction.asset.multiSignatureLegacy.keysgroup = transaction.asset.multiSignatureLegacy.keysgroup.map(k =>
                k.startsWith("+") ? k : `+${k}`,
            );
        }
    }

    private getByteBuffer(serialized: Buffer | string): ByteBuffer {
        if (!(serialized instanceof Buffer)) {
            serialized = Buffer.from(serialized, "hex");
        }

        const buffer: ByteBuffer = new ByteBuffer(serialized.length, true);
        buffer.append(serialized);
        buffer.reset();

        return buffer;
    }
}

export const deserializer = new Deserializer();
