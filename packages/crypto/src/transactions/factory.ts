// tslint:disable:member-ordering
import { MalformedTransactionBytesError, TransactionSchemaError, TransactionVersionError } from "../errors";
import { ISchemaValidationResult, ITransaction, ITransactionData, ITransactionJson } from "../interfaces";
import { BigNumber, isException } from "../utils";
import { validator } from "../validation";
import { deserializer } from "./deserializer";
import { Serializer } from "./serializer";
import { TransactionTypeFactory } from "./types";
import { Transaction } from "./types/transaction";

export class TransactionFactory {
    public static fromHex(hex: string): ITransaction {
        return this.fromSerialized(hex);
    }

    public static fromBytes(buffer: Buffer): ITransaction {
        return this.fromSerialized(buffer ? buffer.toString("hex") : null);
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
            transaction.data.id = id || Transaction.getId(transaction.data);
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

        const transaction: ITransaction = TransactionTypeFactory.create(value);

        if (transaction.data.version === 1) {
            deserializer.applyV1Compatibility(transaction.data);
        }

        Serializer.serialize(transaction);

        data.id = Transaction.getId(data);
        transaction.isVerified = transaction.verify();

        return transaction;
    }

    private static fromSerialized(serialized: string): ITransaction {
        try {
            const transaction = deserializer.deserialize(serialized);
            transaction.data.id = Transaction.getId(transaction.data);

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
        const { $id } = TransactionTypeFactory.get(data.type).getSchema();
        return validator.validate(strict ? `${$id}Strict` : `${$id}`, data);
    }
}
