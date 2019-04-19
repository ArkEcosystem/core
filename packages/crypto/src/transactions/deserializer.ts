import ByteBuffer from "bytebuffer";
import { TransactionTypes } from "../enums";
import { MalformedTransactionBytesError, TransactionVersionError } from "../errors";
import { Address } from "../identities";
import { ITransaction, ITransactionData } from "../interfaces";
import { configManager } from "../managers";
import { BigNumber } from "../utils";
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

        const { version } = data;
        if (version === 1) {
            this.applyV1Compatibility(data);
        } else if (version === 2 && configManager.getMilestone().aip11) {
            // TODO
        } else {
            throw new TransactionVersionError(version);
        }

        instance.serialized = buffer.flip().toBuffer();

        return instance;
    }

    private deserializeCommon(transaction: ITransactionData, buf: ByteBuffer): void {
        buf.skip(1); // Skip 0xFF marker
        transaction.version = buf.readUint8();
        transaction.network = buf.readUint8();
        transaction.type = buf.readUint8();
        transaction.timestamp = buf.readUint32();
        transaction.senderPublicKey = buf.readBytes(33).toString("hex");
        transaction.fee = BigNumber.make(buf.readUint64().toString());
        transaction.amount = BigNumber.ZERO;
    }

    private deserializeVendorField(transaction: ITransaction, buf: ByteBuffer): void {
        if (!transaction.hasVendorField()) {
            buf.skip(1);
            return;
        }

        const vendorFieldLength: number = buf.readUint8();
        if (vendorFieldLength > 0) {
            transaction.data.vendorFieldHex = buf.readBytes(vendorFieldLength).toString("hex");
        }
    }

    private deserializeSignatures(transaction: ITransactionData, buf: ByteBuffer) {
        if (transaction.version === 1) {
            this.deserializeECDSA(transaction, buf);
        } else if (transaction.version === 2) {
            this.deserializeSchnorr(transaction, buf);
        }
    }

    private deserializeECDSA(transaction: ITransactionData, buf: ByteBuffer) {
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
    }

    private deserializeSchnorr(transaction: ITransactionData, buf: ByteBuffer) {
        const canReadNonMultiSignature = () => {
            return buf.remaining() % 64 === 0 || buf.remaining() % 65 !== 0;
        };

        if (canReadNonMultiSignature()) {
            transaction.signature = buf.readBytes(64).toString("hex");
        }

        if (canReadNonMultiSignature()) {
            transaction.secondSignature = buf.readBytes(64).toString("hex");
        }

        if (buf.remaining() && buf.remaining() % 65 === 0) {
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

    // tslint:disable-next-line:member-ordering
    public applyV1Compatibility(transaction: ITransactionData): void {
        transaction.secondSignature = transaction.secondSignature || transaction.signSignature;

        if (transaction.type === TransactionTypes.Vote) {
            transaction.recipientId = Address.fromPublicKey(transaction.senderPublicKey, transaction.network);
        } else if (transaction.type === TransactionTypes.MultiSignature) {
            transaction.asset.multiSignatureLegacy.keysgroup = transaction.asset.multiSignatureLegacy.keysgroup.map(k =>
                k.startsWith("+") ? k : `+${k}`,
            );
        }

        if (transaction.vendorFieldHex) {
            transaction.vendorField = Buffer.from(transaction.vendorFieldHex, "hex").toString("utf8");
        }
    }

    private getByteBuffer(serialized: Buffer | string): ByteBuffer {
        let buffer: ByteBuffer;
        if (serialized instanceof Buffer) {
            buffer = new ByteBuffer(serialized.length, true);
            buffer.append(serialized);
            buffer.reset();
        } else {
            buffer = ByteBuffer.fromHex(serialized, true);
        }

        return buffer;
    }
}

export const deserializer = new Deserializer();
