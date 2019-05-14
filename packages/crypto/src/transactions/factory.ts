// tslint:disable:member-ordering
import { MalformedTransactionBytesError, TransactionSchemaError, TransactionVersionError } from "../errors";
import { ITransaction, ITransactionData, ITransactionJson } from "../interfaces";
import { BigNumber, isException } from "../utils";
import { deserializer } from "./deserializer";
import { Serializer } from "./serializer";
import { TransactionTypeFactory } from "./types";
import { Utils } from "./utils";
import { Verifier } from "./verifier";

export class TransactionFactory {
    public static fromHex(hex: string): ITransaction {
        return this.fromSerialized(hex);
    }

    public static fromBytes(buffer: Buffer): ITransaction {
        return this.fromSerialized(buffer ? buffer.toString("hex") : undefined);
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
            transaction.data.id = id || Utils.getId(transaction.data);
            transaction.isVerified = true;

            return transaction;
        } catch (error) {
            throw new MalformedTransactionBytesError();
        }
    }

    public static fromJson(json: ITransactionJson): ITransaction {
        const data: ITransactionData = ({ ...json } as unknown) as ITransactionData;
        data.amount = BigNumber.make(data.amount);
        data.fee = BigNumber.make(data.fee);

        return this.fromData(data);
    }

    public static fromData(data: ITransactionData, strict: boolean = true): ITransaction {
        const { value, error } = Verifier.verifySchema(data, strict);

        if (error && !isException(value)) {
            throw new TransactionSchemaError(error);
        }

        const transaction: ITransaction = TransactionTypeFactory.create(value);

        const { version } = transaction.data;
        if (!version || version === 1) {
            deserializer.applyV1Compatibility(transaction.data);
        }

        Serializer.serialize(transaction);

        data.id = Utils.getId(data);
        transaction.isVerified = transaction.verify();

        return transaction;
    }

    private static fromSerialized(serialized: string): ITransaction {
        try {
            const transaction = deserializer.deserialize(serialized);
            transaction.data.id = Utils.getId(transaction.data);

            const { value, error } = Verifier.verifySchema(transaction.data, true);

            if (error && !isException(value)) {
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
}
