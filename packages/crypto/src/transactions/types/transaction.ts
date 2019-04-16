// tslint:disable:member-ordering
import { crypto } from "../../crypto";
import { TransactionTypes } from "../../enums";
import {
    MalformedTransactionBytesError,
    NotImplementedError,
    TransactionSchemaError,
    TransactionVersionError,
} from "../../errors";
import { ISchemaValidationResult, ITransaction, ITransactionData, ITransactionJson } from "../../interfaces";
import { BigNumber, isException } from "../../utils";
import { validator } from "../../validation";
import { deserializer } from "../deserializer";
import { Serializer } from "../serializer";
import { TransactionTypeFactory } from "./factory";
import { TransactionSchema } from "./schemas";

export abstract class Transaction implements ITransaction {
    public static type: TransactionTypes = null;

    public static fromHex(hex: string): Transaction {
        return this.fromSerialized(hex);
    }

    public static fromBytes(buffer: Buffer): Transaction {
        return this.fromSerialized(buffer);
    }

    /**
     * Deserializes a transaction from `buffer` with the given `id`. It is faster
     * than `fromBytes` at the cost of vital safety checks (validation, verification and id calculation).
     *
     * NOTE: Only use this internally when it is safe to assume the buffer has already been
     * verified.
     */
    public static fromBytesUnsafe(buffer: Buffer, id?: string): Transaction {
        try {
            const transaction = deserializer.deserialize(buffer);
            transaction.data.id = id || crypto.getId(transaction.data);
            transaction.isVerified = true;

            return transaction;
        } catch (error) {
            throw new MalformedTransactionBytesError();
        }
    }

    private static fromSerialized(serialized: string | Buffer): Transaction {
        try {
            const transaction = deserializer.deserialize(serialized);
            transaction.data.id = crypto.getId(transaction.data);

            const { value, error } = this.validateSchema(transaction.data, true);

            if (error !== null && !isException(value)) {
                throw new TransactionSchemaError(error);
            }

            transaction.isVerified = transaction.verify();

            return transaction;
        } catch (error) {
            if (error instanceof TransactionVersionError || error instanceof TransactionSchemaError) {
                throw error;
            }

            throw new MalformedTransactionBytesError();
        }
    }

    public static fromData(data: ITransactionData, strict: boolean = true): Transaction {
        const { value, error } = this.validateSchema(data, strict);

        if (error !== null && !isException(value)) {
            throw new TransactionSchemaError(error);
        }

        const transaction = TransactionTypeFactory.create(value);
        deserializer.applyV1Compatibility(transaction.data); // TODO: generalize this kinda stuff
        Serializer.serialize(transaction);

        data.id = crypto.getId(data);
        transaction.isVerified = transaction.verify();

        return transaction;
    }

    public static toBytes(data: ITransactionData): Buffer {
        const transaction = TransactionTypeFactory.create(data);
        return Serializer.serialize(transaction);
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

        return crypto.verify(data);
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

    private static validateSchema(data: ITransactionData, strict: boolean): ISchemaValidationResult {
        // FIXME: legacy type 4 need special treatment
        if (data.type === TransactionTypes.MultiSignature) {
            // @TODO: remove the BigNumber.make
            data.amount = BigNumber.make(data.amount);
            // @TODO: remove the BigNumber.make
            data.fee = BigNumber.make(data.fee);
            return { value: data, error: null };
        }

        const { $id } = TransactionTypeFactory.get(data.type).getSchema();

        return validator.validate(strict ? `${$id}Strict` : `${$id}`, data);
    }
}
