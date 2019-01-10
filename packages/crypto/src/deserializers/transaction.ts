import bs58check from "bs58check";
import ByteBuffer from "bytebuffer";
import { TransactionTypes } from "../constants";
import { Transaction } from "../models";
import { Bignum } from "../utils/bignum";

export interface IDeserializedTransactionData {
    version: number;
    network: number;
    type: TransactionTypes;
    timestamp: any;
    senderPublicKey: string;
    fee: Bignum;

    amount?: Bignum;
    expiration?: number;
    recipientId?: string;

    asset?: any;
    vendorField?: string;
    vendorFieldHex?: string;

    signature: string;
    secondSignature?: string;
    signSignature?: string;
    signatures?: string[];

    timelock: any;
    timelockType: number;

    id: string;
    verified: boolean;
}

class TransactionDeserializer {
    public deserialize(serializedHex: string): IDeserializedTransactionData {
        const transaction = {} as IDeserializedTransactionData;
        const buf = ByteBuffer.fromHex(serializedHex, true);

        this.deserializeCommon(transaction, buf);
        this.deserializeVendorField(transaction, buf);
        this.deserializeType(transaction, buf);
        this.deserializeSignatures(transaction, buf);

        return transaction;
    }

    private deserializeCommon(transaction: IDeserializedTransactionData, buf: ByteBuffer): void {
        buf.skip(1); // Skip 0xFF marker
        transaction.version = buf.readUint8();
        transaction.network = buf.readUint8();
        transaction.type = buf.readUint8();
        transaction.timestamp = buf.readUint32();
        transaction.senderPublicKey = buf.readBytes(33).toString("hex");// serializedHex.substring(16, 16 + 33 * 2);
        transaction.fee = new Bignum(buf.readUint64().toString());
        transaction.amount = Bignum.ZERO;
    }

    private deserializeVendorField(transaction: IDeserializedTransactionData, buf: ByteBuffer): void {
        if (!Transaction.canHaveVendorField(transaction.type)) {
            buf.skip(1);
            return;
        }

        const vendorFieldLength = buf.readUint8();
        if (vendorFieldLength > 0) {
            transaction.vendorFieldHex = buf.readBytes(vendorFieldLength).toString("hex");
        }
    }

    private deserializeType(transaction: IDeserializedTransactionData, buf: ByteBuffer): void {
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
            throw new Error(`Type ${transaction.type} not supported.`);
        }
    }

    private deserializeTransfer(transaction: IDeserializedTransactionData, buf: ByteBuffer): void {
        transaction.amount = new Bignum(buf.readUint64().toString());
        transaction.expiration = buf.readUint32();
        transaction.recipientId = bs58check.encode(buf.readBytes(21).toBuffer())
    }

    private deserializeSecondSignature(transaction: IDeserializedTransactionData, buf: ByteBuffer): void {
        transaction.asset = {
            signature: {
                publicKey: buf.readBytes(33).toString("hex"),
            },
        };
    }

    private deserializeDelegateRegistration(transaction: IDeserializedTransactionData, buf: ByteBuffer): void {
        const usernamelength = buf.readUint8();

        transaction.asset = {
            delegate: {
                username: buf.readString(usernamelength),
            },
        };
    }

    private deserializeVote(transaction: IDeserializedTransactionData, buf: ByteBuffer): void {
        const votelength = buf.readUint8();
        transaction.asset = { votes: [] };

        for (let i = 0; i < votelength; i++) {
            let vote = buf.readBytes(34).toString("hex");
            vote = (vote[1] === "1" ? "+" : "-") + vote.slice(2);
            transaction.asset.votes.push(vote);
        }
    }

    private deserializeMultiSignature(transaction: IDeserializedTransactionData, buf: ByteBuffer): void {
        transaction.asset = { multisignature: { keysgroup: [] } };
        transaction.asset.multisignature.min = buf.readUint8();

        const num = buf.readUint8();
        transaction.asset.multisignature.lifetime = buf.readUint8();

        for (let index = 0; index < num; index++) {
            const key = buf.readBytes(33).toString("hex");
            transaction.asset.multisignature.keysgroup.push(key);
        }
    }

    private deserializeIpfs(transaction: IDeserializedTransactionData, buf: ByteBuffer): void {
        const dagLength = buf.readUint8();
        transaction.asset = {
            dag: buf.readBytes(dagLength).toString("hex")
        };
    }

    private deserializeTimelockTransfer(transaction: IDeserializedTransactionData, buf: ByteBuffer): void {
        transaction.amount = new Bignum(buf.readUint64().toString());
        transaction.timelockType = buf.readUint8();
        transaction.timelock = buf.readUint64().toNumber();
        transaction.recipientId = bs58check.encode(buf.readBytes(21));
    }

    private deserializeMultiPayment(transaction: IDeserializedTransactionData, buf: ByteBuffer): void {
        const payments = []
        const total = buf.readUint8();

        for (let j = 0; j < total; j++) {
            const payment: any = {};
            payment.amount = new Bignum(buf.readUint64().toString());
            payment.recipientId = bs58check.encode(buf.readBytes(21));
            payments.push(payment);
        }

        transaction.amount = payments.reduce((a, p) => a.plus(p.amount), Bignum.ZERO);
        transaction.asset = { payments };
    }

    private deserializeDelegateResignation(transaction: IDeserializedTransactionData, buf: ByteBuffer): void {
        return;
    }

    private deserializeSignatures(transaction: IDeserializedTransactionData, buf: ByteBuffer) {
        const currentSignatureLength = (): number => {
            buf.mark();
            const lengthHex = buf.skip(1).readBytes(1).toString("hex");
            buf.reset();

            return parseInt(lengthHex, 16) + 2;
        }

        // Signature
        if (buf.remaining()) {
            const signatureLength = currentSignatureLength();
            transaction.signature = buf.readBytes(signatureLength).toString("hex");
        }

        const beginningMultiSignature = () => { buf.mark(); const marker = buf.readUint8(); buf.reset(); return marker === 255; }

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
}

export const transactionDeserializer = new TransactionDeserializer();