// tslint:disable:member-ordering
import { crypto } from "../crypto";
import { TransactionTypes } from "../enums";
import { MalformedTransactionBytesError, TransactionSchemaError, TransactionVersionError } from "../errors";
import { ISchemaValidationResult, ITransaction, ITransactionData, ITransactionJson } from "../interfaces";
import { BigNumber, isException } from "../utils";
import { validator } from "../validation";
import { deserializer } from "./deserializer";
import { transactionRegistry } from "./registry";
import { Serializer } from "./serializer";

export class TransactionFactory {
    public static fromHex(hex: string): ITransaction {
        let buffer: Buffer;

        try {
            buffer = Buffer.from(hex, "hex");
        } catch (error) {
            throw new MalformedTransactionBytesError();
        }

        return this.fromSerialized(buffer);
    }

    public static fromBytes(buffer: Buffer): ITransaction {
        return this.fromSerialized(buffer);
    }

    /**
     * Deserializes a transaction from `buffer` with the given `id`. It is faster
     * than `fromBytes` at the cost of vital safety checks (validation, verification and id calculation).
     *
     * NOTE: Only use this internally when it is safe to assume the buffer has already been
     * verified.
     */
    public static fromBytesUnsafe(buffer: Buffer, id?: string): ITransaction {
        try {
            const transaction = deserializer.deserialize(buffer);
            transaction.data.id = id || crypto.getId(transaction.data);
            transaction.isVerified = true;

            return transaction;
        } catch (error) {
            throw new MalformedTransactionBytesError();
        }
    }

    public static fromJson(json: ITransactionJson): ITransaction {
        // @ts-ignore
        const data: ITransactionData = { ...json };
        data.amount = BigNumber.make(data.amount);
        data.fee = BigNumber.make(data.fee);

        return this.fromData(data);
    }

    public static fromData(data: ITransactionData, strict: boolean = true): ITransaction {
        const { value, error } = this.validateSchema(data, strict);

        if (error !== null && !isException(value)) {
            throw new TransactionSchemaError(error);
        }

        const transaction: ITransaction = transactionRegistry.create(value);
        deserializer.applyV1Compatibility(transaction.data); // TODO: generalize this kinda stuff
        Serializer.serialize(transaction);

        data.id = crypto.getId(data);
        transaction.isVerified = transaction.verify();

        return transaction;
    }

    private static fromSerialized(serialized: Buffer): ITransaction {
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

    private static validateSchema(data: ITransactionData, strict: boolean): ISchemaValidationResult {
        // FIXME: legacy type 4 need special treatment
        if (data.type === TransactionTypes.MultiSignature) {
            return { value: data, error: null };
        }

        const { $id } = transactionRegistry.get(data.type).getSchema();

        return validator.validate(strict ? `${$id}Strict` : `${$id}`, data);
    }
}
