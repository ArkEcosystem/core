// tslint:disable:member-ordering
import {
    DuplicateParticipantInMultiSignatureError,
    InvalidTransactionBytesError,
    TransactionSchemaError,
    TransactionVersionError,
} from "../errors";
import {
    IDeserializeOptions,
    ISerializeOptions,
    ITransaction,
    ITransactionData,
    ITransactionJson,
} from "../interfaces";
import { BigNumber, isException } from "../utils";
import { Deserializer } from "./deserializer";
import { Serializer } from "./serializer";
import { TransactionTypeFactory } from "./types";
import { Utils } from "./utils";
import { Verifier } from "./verifier";

export class TransactionFactory {
    public static fromHex(hex: string): ITransaction {
        return this.fromSerialized(hex);
    }

    public static fromBytes(buffer: Buffer, strict: boolean = true): ITransaction {
        return this.fromSerialized(buffer ? buffer.toString("hex") : undefined, strict);
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
            const options: IDeserializeOptions | ISerializeOptions = { acceptLegacyVersion: true };
            const transaction = Deserializer.deserialize(buffer, options);
            transaction.data.id = id || Utils.getId(transaction.data, options);
            transaction.isVerified = true;

            return transaction;
        } catch (error) {
            throw new InvalidTransactionBytesError(error.message);
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
        if (version === 1) {
            Deserializer.applyV1Compatibility(transaction.data);
        }

        Serializer.serialize(transaction);

        return this.fromBytes(transaction.serialized, strict);
    }

    private static fromSerialized(serialized: string, strict: boolean = true): ITransaction {
        try {
            const transaction = Deserializer.deserialize(serialized);
            transaction.data.id = Utils.getId(transaction.data);

            const { value, error } = Verifier.verifySchema(transaction.data, strict);

            if (error && !isException(value)) {
                throw new TransactionSchemaError(error);
            }

            transaction.isVerified = transaction.verify();

            return transaction;
        } catch (error) {
            if (
                error instanceof TransactionVersionError ||
                error instanceof TransactionSchemaError ||
                error instanceof DuplicateParticipantInMultiSignatureError
            ) {
                throw error;
            }

            throw new InvalidTransactionBytesError(error.message);
        }
    }
}
