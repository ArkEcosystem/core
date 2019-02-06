import ByteBuffer from "bytebuffer";
import { AbstractTransaction, TransactionRepository } from "..";
import { TransactionTypes } from "../../constants";
import { crypto } from "../../crypto";
import { configManager } from "../../managers";
import { Bignum } from "../../utils/bignum";
import { ITransactionData } from "../interfaces";

const { transactionIdFixTable } = configManager.getPreset("mainnet").exceptions;

// Reference: https://github.com/ArkEcosystem/AIPs/blob/master/AIPS/aip-11.md
class TransactionDeserializer {
    public deserialize(serializedHex: string): AbstractTransaction {
        const data = {} as ITransactionData;
        const buf = ByteBuffer.fromHex(serializedHex, true);

        this.deserializeCommon(data, buf);

        const instance = TransactionRepository.create(data);
        this.deserializeVendorField(instance, buf);

        // Deserialize type specific parts
        instance.deserialize(buf);

        this.deserializeSignatures(data, buf);
        this.applyV1Compatibility(data);

        instance.serialized = Buffer.from(serializedHex);

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

    private deserializeVendorField(transaction: AbstractTransaction, buf: ByteBuffer): void {
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

    private applyV1Compatibility(transaction: ITransactionData): void {
        if (transaction.version && transaction.version !== 1) {
            return;
        }

        if (transaction.secondSignature) {
            transaction.signSignature = transaction.secondSignature;
        }

        if (transaction.type === TransactionTypes.Vote) {
            transaction.recipientId = crypto.getAddress(transaction.senderPublicKey, transaction.network);
        } else if (transaction.type === TransactionTypes.MultiSignature) {
            transaction.asset.multisignature.keysgroup = transaction.asset.multisignature.keysgroup.map(k => `+${k}`);
        }

        if (transaction.vendorFieldHex) {
            transaction.vendorField = Buffer.from(transaction.vendorFieldHex, "hex").toString("utf8");
        }

        if (
            transaction.type === TransactionTypes.SecondSignature ||
            transaction.type === TransactionTypes.MultiSignature
        ) {
            transaction.recipientId = crypto.getAddress(transaction.senderPublicKey, transaction.network);
        }

        transaction.id = crypto.getId(transaction);

        // Apply fix for broken type 1 and 4 transactions, which were
        // erroneously calculated with a recipient id.
        if (transactionIdFixTable[transaction.id]) {
            transaction.id = transactionIdFixTable[transaction.id];
        }
    }
}

export const transactionDeserializer = new TransactionDeserializer();
