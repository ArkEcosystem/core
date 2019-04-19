import { Hash, HashAlgorithms } from "../../crypto";
import { TransactionTypes } from "../../enums";
import { IKeyPair, ISerializeOptions, ITransaction, ITransactionData, ITransactionJson } from "../../interfaces";
import { configManager } from "../../managers";
import { isException } from "../../utils";
import { Serializer } from "../serializer";
import { TransactionTypeFactory } from "./factory";
import { TransactionSchema } from "./schemas";
import * as schemas from "./schemas";

export abstract class Transaction implements ITransaction {
    public get id(): string {
        return this.data.id;
    }

    public get type(): TransactionTypes {
        return this.data.type;
    }
    public get verified(): boolean {
        return this.isVerified;
    }

    public static type: TransactionTypes = null;

    public static toBytes(data: ITransactionData): Buffer {
        return Serializer.serialize(TransactionTypeFactory.create(data));
    }

    public static verifyData(data: ITransactionData): boolean {
        const { signature, senderPublicKey } = data;
        if (!signature) {
            return false;
        }

        const hash = Transaction.getHash(data, { excludeSignature: true, excludeSecondSignature: true });
        if (data.version === 2) {
            return Hash.verifySchnorr(hash, signature, senderPublicKey);
        } else {
            return Hash.verifyECDSA(hash, signature, senderPublicKey);
        }
    }

    public static getSchema(): TransactionSchema {
        return schemas.multiSignature;
    }

    public static getId(transaction: ITransactionData): string {
        const id: string = Transaction.getHash(transaction).toString("hex");

        // Apply fix for broken type 1 and 4 transactions, which were
        // erroneously calculated with a recipient id.
        const { transactionIdFixTable } = configManager.get("exceptions");

        if (transactionIdFixTable && transactionIdFixTable[id]) {
            return transactionIdFixTable[id];
        }

        return id;
    }

    public static getHash(transaction: ITransactionData, options?: ISerializeOptions): Buffer {
        return HashAlgorithms.sha256(Serializer.getBytes(transaction, options));
    }

    public static sign(transaction: ITransactionData, keys: IKeyPair, options?: ISerializeOptions): string {
        options = options || { excludeSignature: true, excludeSecondSignature: true };
        const hash: Buffer = Transaction.getHash(transaction, options);
        const signature: string = transaction.version === 2 ? Hash.signSchnorr(hash, keys) : Hash.signECDSA(hash, keys);

        if (!transaction.signature && !options.excludeMultiSignature) {
            transaction.signature = signature;
        }

        return signature;
    }

    public static secondSign(transaction: ITransactionData, keys: IKeyPair): string {
        const hash: Buffer = Transaction.getHash(transaction, { excludeSecondSignature: true });
        const signature: string = transaction.version === 2 ? Hash.signSchnorr(hash, keys) : Hash.signECDSA(hash, keys);

        if (!transaction.secondSignature) {
            transaction.secondSignature = signature;
        }

        return signature;
    }

    public static verifySecondSignature(transaction: ITransactionData, publicKey: string): boolean {
        const secondSignature = transaction.secondSignature || transaction.signSignature;

        if (!secondSignature) {
            return false;
        }

        const hash = Transaction.getHash(transaction, { excludeSecondSignature: true });
        if (transaction.version === 2) {
            return Hash.verifySchnorr(hash, secondSignature, publicKey);
        } else {
            return Hash.verifyECDSA(hash, secondSignature, publicKey);
        }
    }

    public isVerified: boolean;

    public data: ITransactionData;
    public serialized: Buffer;
    public timestamp: number;

    public abstract serialize(): ByteBuffer;
    public abstract deserialize(buf: ByteBuffer): void;

    public verify(): boolean {
        const { data } = this;

        if (isException(data)) {
            return true;
        }

        if (data.type > 4 && data.type <= 99) {
            return false;
        }

        return Transaction.verifyData(data);
    }

    public toJson(): ITransactionJson {
        const data: ITransactionJson = JSON.parse(JSON.stringify(this.data));
        data.amount = this.data.amount.toFixed();
        data.fee = this.data.fee.toFixed();

        if (data.vendorFieldHex === null) {
            delete data.vendorFieldHex;
        }

        return data;
    }

    public hasVendorField(): boolean {
        return false;
    }
}
