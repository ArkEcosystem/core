import bs58check from "bs58check";
import ByteBuffer from "bytebuffer";
import { TransactionTypes } from "../constants";
import { TransactionTypeError } from "../errors";
import { configManager } from "../managers";
import { Transaction } from "../models";
import { ITransactionData } from "../models/transaction";
import { Bignum } from "../utils";

// Reference: https://github.com/ArkEcosystem/AIPs/blob/master/AIPS/aip-11.md
class TransactionSerializer {
    public serialize(transaction: ITransactionData): Buffer {
        const buffer = new ByteBuffer(512, true);

        this.serializeCommon(transaction, buffer);
        this.serializeVendorField(transaction, buffer);
        this.serializeType(transaction, buffer);
        this.serializeSignatures(transaction, buffer);

        return Buffer.from(buffer.flip().toBuffer());
    }

    private serializeCommon(transaction: ITransactionData, buffer: ByteBuffer): void {
        buffer.writeByte(0xff); // fill, to disambiguate from v1
        buffer.writeByte(transaction.version || 0x01); // version
        buffer.writeByte(transaction.network || configManager.get("pubKeyHash")); // ark = 0x17, devnet = 0x30
        buffer.writeByte(transaction.type);
        buffer.writeUint32(transaction.timestamp);
        buffer.append(transaction.senderPublicKey, "hex");
        buffer.writeUint64(+new Bignum(transaction.fee).toFixed());
    }

    private serializeVendorField(transaction: ITransactionData, buffer: ByteBuffer): void {
        if (Transaction.canHaveVendorField(transaction.type)) {
            if (transaction.vendorField) {
                const vf = Buffer.from(transaction.vendorField, "utf8");
                buffer.writeByte(vf.length);
                buffer.append(vf);
            } else if (transaction.vendorFieldHex) {
                buffer.writeByte(transaction.vendorFieldHex.length / 2);
                buffer.append(transaction.vendorFieldHex, "hex");
            } else {
                buffer.writeByte(0x00);
            }
        } else {
            buffer.writeByte(0x00);
        }
    }

    private serializeType(transaction: ITransactionData, buffer: ByteBuffer): void {
        if (transaction.type === TransactionTypes.Transfer) {
            this.serializeTransfer(transaction, buffer);
        } else if (transaction.type === TransactionTypes.SecondSignature) {
            this.serializeSecondSignature(transaction, buffer);
        } else if (transaction.type === TransactionTypes.DelegateRegistration) {
            this.serializeDelegateRegistration(transaction, buffer);
        } else if (transaction.type === TransactionTypes.Vote) {
            this.serializeVote(transaction, buffer);
        } else if (transaction.type === TransactionTypes.MultiSignature) {
            this.serializeMultiSignature(transaction, buffer);
        } else if (transaction.type === TransactionTypes.Ipfs) {
            this.serializeIpfs(transaction, buffer);
        } else if (transaction.type === TransactionTypes.TimelockTransfer) {
            this.serializeTimelockTransfer(transaction, buffer);
        } else if (transaction.type === TransactionTypes.MultiPayment) {
            this.serializeMultiPayment(transaction, buffer);
        } else if (transaction.type === TransactionTypes.DelegateResignation) {
            this.serializeDelegateResignation(transaction, buffer);
        } else {
            throw new TransactionTypeError(transaction.type);
        }
    }

    private serializeTransfer(transaction: ITransactionData, buffer: ByteBuffer): void {
        buffer.writeUint64(+new Bignum(transaction.amount).toFixed());
        buffer.writeUint32(transaction.expiration || 0);
        buffer.append(bs58check.decode(transaction.recipientId));
    }

    private serializeSecondSignature(transaction: ITransactionData, buffer: ByteBuffer): void {
        buffer.append(transaction.asset.signature.publicKey, "hex");
    }

    private serializeDelegateRegistration(transaction: ITransactionData, buffer: ByteBuffer): void {
        const delegateBytes = Buffer.from(transaction.asset.delegate.username, "utf8");
        buffer.writeByte(delegateBytes.length);
        buffer.append(delegateBytes, "hex");
    }

    private serializeVote(transaction: ITransactionData, buffer: ByteBuffer): void {
        const voteBytes = transaction.asset.votes.map(vote => (vote[0] === "+" ? "01" : "00") + vote.slice(1)).join("");
        buffer.writeByte(transaction.asset.votes.length);
        buffer.append(voteBytes, "hex");
    }

    private serializeMultiSignature(transaction: ITransactionData, buffer: ByteBuffer): void {
        let joined = null;

        if (!transaction.version || transaction.version === 1) {
            joined = transaction.asset.multisignature.keysgroup.map(k => (k[0] === "+" ? k.slice(1) : k)).join("");
        } else {
            joined = transaction.asset.multisignature.keysgroup.join("");
        }

        const keysgroupBuffer = Buffer.from(joined, "hex");
        buffer.writeByte(transaction.asset.multisignature.min);
        buffer.writeByte(transaction.asset.multisignature.keysgroup.length);
        buffer.writeByte(transaction.asset.multisignature.lifetime);
        buffer.append(keysgroupBuffer, "hex");
    }

    private serializeIpfs(transaction: ITransactionData, buffer: ByteBuffer): void {
        buffer.writeByte(transaction.asset.ipfs.dag.length / 2);
        buffer.append(transaction.asset.ipfs.dag, "hex");
    }

    private serializeTimelockTransfer(transaction: ITransactionData, buffer: ByteBuffer): void {
        buffer.writeUint64(+new Bignum(transaction.amount).toFixed());
        buffer.writeByte(transaction.timelockType);
        buffer.writeUint64(transaction.timelock);
        buffer.append(bs58check.decode(transaction.recipientId));
    }

    private serializeMultiPayment(transaction: ITransactionData, buffer: ByteBuffer): void {
        buffer.writeUint32(transaction.asset.payments.length);
        transaction.asset.payments.forEach(p => {
            buffer.writeUint64(+new Bignum(p.amount).toFixed());
            buffer.append(bs58check.decode(p.recipientId));
        });
    }

    private serializeDelegateResignation(transaction: ITransactionData, buffer: ByteBuffer): void {
        return;
    }

    private serializeSignatures(transaction: ITransactionData, buffer: ByteBuffer): void {
        if (transaction.signature) {
            buffer.append(transaction.signature, "hex");
        }

        if (transaction.secondSignature) {
            buffer.append(transaction.secondSignature, "hex");
        } else if (transaction.signSignature) {
            buffer.append(transaction.signSignature, "hex");
        }

        if (transaction.signatures) {
            buffer.append("ff", "hex"); // 0xff separator to signal start of multi-signature transactions
            buffer.append(transaction.signatures.join(""), "hex");
        }
    }
}

export const transactionSerializer = new TransactionSerializer();
