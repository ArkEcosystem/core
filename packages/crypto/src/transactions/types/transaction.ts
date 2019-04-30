// tslint:disable:member-ordering
import { Hash, HashAlgorithms } from "../../crypto";
import { TransactionTypes } from "../../enums";
import { NotImplementedError } from "../../errors";
import {
    IKeyPair,
    ISchemaValidationResult,
    ISerializeOptions,
    ITransaction,
    ITransactionData,
    ITransactionJson,
} from "../../interfaces";
import { configManager } from "../../managers";
import { Serializer } from "../serializer";
import { Verifier } from "../verifier";
import { TransactionTypeFactory } from "./factory";
import { TransactionSchema } from "./schemas";

export abstract class Transaction implements ITransaction {
    public static type: TransactionTypes = null;

    public static toBytes(data: ITransactionData): Buffer {
        return Serializer.serialize(TransactionTypeFactory.create(data));
    }

    public get id(): string {
        return this.data.id;
    }

    public get type(): TransactionTypes {
        return this.data.type;
    }

    public isVerified: boolean;
    public get verified(): boolean {
        return this.isVerified;
    }

    public data: ITransactionData;
    public serialized: Buffer;
    public timestamp: number;

    public abstract serialize(): ByteBuffer;
    public abstract deserialize(buf: ByteBuffer): void;

    public verify(): boolean {
        return Verifier.verify(this.data);
    }

    public verifySecondSignature(publicKey: string): boolean {
        return Verifier.verifySecondSignature(this.data, publicKey);
    }

    public verifySchema(): ISchemaValidationResult {
        return Verifier.verifySchema(this.data);
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

    public static getSchema(): TransactionSchema {
        throw new NotImplementedError();
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

    // @TODO: move this out, the transaction itself shouldn't know how signing works
    public static sign(transaction: ITransactionData, keys: IKeyPair, options?: ISerializeOptions): string {
        options = options || { excludeSignature: true, excludeSecondSignature: true };
        const hash: Buffer = Transaction.getHash(transaction, options);
        const signature: string = transaction.version === 2 ? Hash.signSchnorr(hash, keys) : Hash.signECDSA(hash, keys);

        if (!transaction.signature && !options.excludeMultiSignature) {
            transaction.signature = signature;
        }

        return signature;
    }

    // @TODO: move this out, the transaction itself shouldn't know how signing works
    public static secondSign(transaction: ITransactionData, keys: IKeyPair): string {
        const hash: Buffer = Transaction.getHash(transaction, { excludeSecondSignature: true });
        const signature: string = transaction.version === 2 ? Hash.signSchnorr(hash, keys) : Hash.signECDSA(hash, keys);

        if (!transaction.secondSignature) {
            transaction.secondSignature = signature;
        }

        return signature;
    }
}
