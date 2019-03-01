import ByteBuffer from "bytebuffer";
import { Transaction, TransactionRegistry } from "..";
import { TransactionTypes } from "../../constants";
import { crypto } from "../../crypto";
import { TransactionVersionError } from "../../errors";
import { configManager } from "../../managers";
import { Bignum } from "../../utils";
import { ITransactionData } from "../interfaces";

// Reference: https://github.com/ArkEcosystem/AIPs/blob/master/AIPS/aip-11.md
class TransactionDeserializer {
    public deserialize(serialized: string | Buffer): Transaction {
        const data = {} as ITransactionData;

        const buffer = this.getByteBuffer(serialized);
        this.deserializeCommon(data, buffer);

        const instance = TransactionRegistry.create(data);
        this.deserializeVendorField(instance, buffer);

        // Deserialize type specific parts
        instance.deserialize(buffer);

        this.deserializeSignatures(data, buffer);

        switch (data.version) {
            case 1:
                this.applyV1Compatibility(data);
                break;
            default:
                throw new TransactionVersionError(data.version);
        }

        data.id = crypto.getId(data);
        instance.serialized = buffer.flip().toBuffer();

        return instance;
    }

    private deserializeCommon(transaction: ITransactionData, buf: ByteBuffer): void {
        buf.skip(1); // Skip 0xFF marker
        transaction.version = buf.readUint8();
        transaction.network = buf.readUint8();
        transaction.type = buf.readUint8();
        transaction.timestamp = buf.readUint32();
        transaction.senderPublicKey = buf.readBytes(33).toString("hex"); // serializedHex.substring(16, 16 + 33 * 2);
        transaction.fee = new Bignum(buf.readUint64().toString());
        transaction.amount = Bignum.ZERO;
    }

    private deserializeVendorField(transaction: Transaction, buf: ByteBuffer): void {
        if (!transaction.hasVendorField()) {
            buf.skip(1);
            return;
        }

        const vendorFieldLength = buf.readUint8();
        if (vendorFieldLength > 0) {
            transaction.data.vendorFieldHex = buf.readBytes(vendorFieldLength).toString("hex");
        }
    }

    private deserializeSignatures(transaction: ITransactionData, buf: ByteBuffer) {
        const currentSignatureLength = (): number => {
            buf.mark();
            const lengthHex = buf
                .skip(1)
                .readBytes(1)
                .toString("hex");
            buf.reset();

            return parseInt(lengthHex, 16) + 2;
        };

        // Signature
        if (buf.remaining()) {
            const signatureLength = currentSignatureLength();
            transaction.signature = buf.readBytes(signatureLength).toString("hex");
        }

        const beginningMultiSignature = () => {
            buf.mark();
            const marker = buf.readUint8();
            buf.reset();
            return marker === 255;
        };

        // Second Signature
        if (buf.remaining() && !beginningMultiSignature()) {
            const secondSignatureLength = currentSignatureLength();
            transaction.secondSignature = buf.readBytes(secondSignatureLength).toString("hex");
        }

        // Multi Signatures
        if (buf.remaining() && beginningMultiSignature()) {
            buf.skip(1);
            transaction.signatures = [];

            while (buf.remaining()) {
                const multiSignatureLength = currentSignatureLength();
                const multiSignature = buf.readBytes(multiSignatureLength).toString("hex");
                transaction.signatures.push(multiSignature);
            }
        }
    }

    // tslint:disable-next-line:member-ordering
    public applyV1Compatibility(transaction: ITransactionData): void {
        if (transaction.secondSignature) {
            transaction.signSignature = transaction.secondSignature;
        }

        if (transaction.type === TransactionTypes.Vote) {
            transaction.recipientId = crypto.getAddress(transaction.senderPublicKey, transaction.network);
        } else if (transaction.type === TransactionTypes.MultiSignature) {
            transaction.asset.multisignature.keysgroup = transaction.asset.multisignature.keysgroup.map(k =>
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

export const transactionDeserializer = new TransactionDeserializer();
