// tslint:disable:member-ordering
import { TransactionRegistry } from "..";
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
import { isException } from "../../utils";
import { validator } from "../../validation";
import { transactionRegistry } from "../registry";
import { Serializer } from "../serializer";
import { TransactionSchema } from "./schemas";

export abstract class Transaction implements ITransaction {
    public static type: TransactionTypes = null;

    public static toBytes(data: ITransactionData): Buffer {
        return Serializer.serialize(TransactionRegistry.create(data));
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
        const { data } = this;

        if (isException(data)) {
            return true;
        }

        if (data.type >= 4 && data.type <= 99) {
            return false;
        }

        return Transaction.verifyData(data);
    }

    public static verifyData(data: ITransactionData): boolean {
        if (data.version && data.version !== 1) {
            // TODO: enable AIP11 when ready here
            return false;
        }

        if (!data.signature) {
            return false;
        }

        return Hash.verify(
            Transaction.getHash(data, { excludeSignature: true, excludeSecondSignature: true }),
            data.signature,
            data.senderPublicKey,
        );
    }

    // @TODO: move this to a more appropriate place
    public validateSchema(strict: boolean = true): ISchemaValidationResult {
        // FIXME: legacy type 4 need special treatment
        if (this.data.type === TransactionTypes.MultiSignature) {
            return { value: this.data, error: null };
        }

        const { $id } = transactionRegistry.get(this.data.type).getSchema();

        return validator.validate(strict ? `${$id}Strict` : `${$id}`, this.data);
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

    public static sign(transaction: ITransactionData, keys: IKeyPair): string {
        const hash: Buffer = Transaction.getHash(transaction, { excludeSignature: true, excludeSecondSignature: true });
        const signature: string = Hash.sign(hash, keys);

        if (!transaction.signature) {
            transaction.signature = signature;
        }

        return signature;
    }

    public static secondSign(transaction: ITransactionData, keys: IKeyPair): string {
        const hash: Buffer = Transaction.getHash(transaction, { excludeSecondSignature: true });
        const signature: string = Hash.sign(hash, keys);

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

        return Hash.verify(
            Transaction.getHash(transaction, { excludeSecondSignature: true }),
            secondSignature,
            publicKey,
        );
    }
}
