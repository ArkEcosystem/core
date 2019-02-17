import bs58check from "bs58check";
import ByteBuffer from "bytebuffer";
import { TransactionTypes } from "../constants";
import { crypto } from "../crypto";
import { TransactionTypeError } from "../errors";
import { configManager } from "../managers";
import { Transaction } from "../models";
import { IMultiSignatureAsset, ITransactionData } from "../models/transaction";
import { Bignum } from "../utils";

const { transactionIdFixTable } = configManager.getPreset("mainnet").exceptions;

// Reference: https://github.com/ArkEcosystem/AIPs/blob/master/AIPS/aip-11.md
class TransactionDeserializer {
    public deserialize(serializedHex: string): ITransactionData {
        const transaction = {} as ITransactionData;
        const buf = ByteBuffer.fromHex(serializedHex, true);

        this.deserializeCommon(transaction, buf);
        this.deserializeVendorField(transaction, buf);
        this.deserializeType(transaction, buf);
        this.deserializeSignatures(transaction, buf);
        this.applyV1Compatibility(transaction);

        return transaction;
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

    private deserializeVendorField(transaction: ITransactionData, buf: ByteBuffer): void {
        if (!Transaction.canHaveVendorField(transaction.type)) {
            buf.skip(1);
            return;
        }

        const vendorFieldLength = buf.readUint8();
        if (vendorFieldLength > 0) {
            transaction.vendorFieldHex = buf.readBytes(vendorFieldLength).toString("hex");
        }
    }

    private deserializeType(transaction: ITransactionData, buf: ByteBuffer): void {
        if (transaction.type === TransactionTypes.Transfer) {
            this.deserializeTransfer(transaction, buf);
        } else if (transaction.type === TransactionTypes.SecondSignature) {
            this.deserializeSecondSignature(transaction, buf);
        } else if (transaction.type === TransactionTypes.DelegateRegistration) {
            this.deserializeDelegateRegistration(transaction, buf);
        } else if (transaction.type === TransactionTypes.Vote) {
            this.deserializeVote(transaction, buf);
        } else if (transaction.type === TransactionTypes.MultiSignature) {
            this.deserializeMultiSignature(transaction, buf);
        } else if (transaction.type === TransactionTypes.Ipfs) {
            this.deserializeIpfs(transaction, buf);
        } else if (transaction.type === TransactionTypes.TimelockTransfer) {
            this.deserializeTimelockTransfer(transaction, buf);
        } else if (transaction.type === TransactionTypes.MultiPayment) {
            this.deserializeMultiPayment(transaction, buf);
        } else if (transaction.type === TransactionTypes.DelegateResignation) {
            this.deserializeDelegateResignation(transaction, buf);
        } else {
            throw new TransactionTypeError(transaction.type);
        }
    }

    private deserializeTransfer(transaction: ITransactionData, buf: ByteBuffer): void {
        transaction.amount = new Bignum(buf.readUint64().toString());
        transaction.expiration = buf.readUint32();
        transaction.recipientId = bs58check.encode(buf.readBytes(21).toBuffer());
    }

    private deserializeSecondSignature(transaction: ITransactionData, buf: ByteBuffer): void {
        transaction.asset = {
            signature: {
                publicKey: buf.readBytes(33).toString("hex"),
            },
        };
    }

    private deserializeDelegateRegistration(transaction: ITransactionData, buf: ByteBuffer): void {
        const usernamelength = buf.readUint8();

        transaction.asset = {
            delegate: {
                username: buf.readString(usernamelength),
            },
        };
    }

    private deserializeVote(transaction: ITransactionData, buf: ByteBuffer): void {
        const votelength = buf.readUint8();
        transaction.asset = { votes: [] };

        for (let i = 0; i < votelength; i++) {
            let vote = buf.readBytes(34).toString("hex");
            vote = (vote[1] === "1" ? "+" : "-") + vote.slice(2);
            transaction.asset.votes.push(vote);
        }
    }

    private deserializeMultiSignature(transaction: ITransactionData, buf: ByteBuffer): void {
        transaction.asset = { multisignature: { keysgroup: [] } as IMultiSignatureAsset };
        transaction.asset.multisignature.min = buf.readUint8();

        const num = buf.readUint8();
        transaction.asset.multisignature.lifetime = buf.readUint8();

        for (let index = 0; index < num; index++) {
            const key = buf.readBytes(33).toString("hex");
            transaction.asset.multisignature.keysgroup.push(key);
        }
    }

    private deserializeIpfs(transaction: ITransactionData, buf: ByteBuffer): void {
        const dagLength = buf.readUint8();
        transaction.asset = {
            ipfs: {
                dag: buf.readBytes(dagLength).toString("hex"),
            },
        };
    }

    private deserializeTimelockTransfer(transaction: ITransactionData, buf: ByteBuffer): void {
        transaction.amount = new Bignum(buf.readUint64().toString());
        transaction.timelockType = buf.readUint8();
        transaction.timelock = buf.readUint64().toNumber();
        transaction.recipientId = bs58check.encode(buf.readBytes(21).toBuffer());
    }

    private deserializeMultiPayment(transaction: ITransactionData, buf: ByteBuffer): void {
        const payments = [];
        const total = buf.readUint32();

        for (let j = 0; j < total; j++) {
            const payment: any = {};
            payment.amount = new Bignum(buf.readUint64().toString());
            payment.recipientId = bs58check.encode(buf.readBytes(21).toBuffer());
            payments.push(payment);
        }

        transaction.amount = payments.reduce((a, p) => a.plus(p.amount), Bignum.ZERO);
        transaction.asset = { payments };
    }

    private deserializeDelegateResignation(transaction: ITransactionData, buf: ByteBuffer): void {
        return;
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
