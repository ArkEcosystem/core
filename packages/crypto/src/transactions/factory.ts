import { CryptoManager } from "..";
import {
    DuplicateParticipantInMultiSignatureError,
    InvalidTransactionBytesError,
    TransactionSchemaError,
    TransactionSchemaIdError,
    TransactionVersionError,
} from "../errors";
import {
    IDeserializeOptions,
    ISerializeOptions,
    ITransaction,
    ITransactionData,
    ITransactionJson,
} from "../interfaces";
import { Deserializer } from "./deserializer";
import { Serializer } from "./serializer";
import { TransactionTypeFactory } from "./types";
import { Utils } from "./utils";
import { Verifier } from "./verifier";

export class TransactionFactory<T, U extends ITransactionData, E> {
    public constructor(
        private cryptoManager: CryptoManager<T>,
        private deserializer: Deserializer<T, U, E>,
        private serializer: Serializer<T, U, E>,
        private verifier: Verifier<T, U, E>,
        private utils: Utils<T, U, E>,
        private transactionTypeFactory: TransactionTypeFactory<T, U, E>,
    ) {}

    public fromHex(hex: string): ITransaction<U, E> {
        return this.fromSerialized(hex);
    }

    public fromBytes(buffer: Buffer, strict = true): ITransaction<U, E> {
        return this.fromSerialized(buffer.toString("hex"), strict);
    }

    /**
     * Deserializes a transaction from `buffer` with the given `id`. It is faster
     * than `fromBytes` at the cost of vital safety checks (validation, verification and id calculation).
     *
     * NOTE: Only use this internally when it is safe to assume the buffer has already been
     * verified.
     */
    public fromBytesUnsafe(buffer: Buffer, id?: string): ITransaction<U, E> {
        try {
            const options: IDeserializeOptions | ISerializeOptions = { acceptLegacyVersion: true };
            const transaction = this.deserializer.deserialize(buffer, options);
            transaction.data.id = id || this.utils.getId(transaction.data, options);
            transaction.isVerified = true;

            return transaction;
        } catch (error) {
            throw new InvalidTransactionBytesError(error.message);
        }
    }

    public fromJson(json: ITransactionJson): ITransaction<U, E> {
        const data: U = ({ ...json } as unknown) as U;
        data.amount = this.cryptoManager.LibraryManager.Libraries.BigNumber.make(data.amount);
        data.fee = this.cryptoManager.LibraryManager.Libraries.BigNumber.make(data.fee);

        return this.fromData(data);
    }

    public fromData(data: U, strict = true): ITransaction<U, E> {
        const { value, error } = this.verifier.verifySchema(data, strict);

        if (value === undefined || value.id === undefined) {
            throw new TransactionSchemaIdError(error);
        }

        if (error && !this.cryptoManager.LibraryManager.Utils.isException(value.id)) {
            throw new TransactionSchemaError(error);
        }

        const transaction: ITransaction<U, E> = this.transactionTypeFactory.create(value);

        const { version } = transaction.data;
        if (version === 1) {
            this.deserializer.applyV1Compatibility(transaction.data);
        }

        this.serializer.serialize(transaction);

        return this.fromBytes(transaction.serialized, strict);
    }

    private fromSerialized(serialized: string, strict = true): ITransaction<U, E> {
        try {
            const transaction = this.deserializer.deserialize(serialized);
            transaction.data.id = this.utils.getId(transaction.data);

            const { value, error } = this.verifier.verifySchema(transaction.data, strict);

            if (value === undefined || value.id === undefined) {
                throw new TransactionSchemaIdError(error);
            }

            if (error && !this.cryptoManager.LibraryManager.Utils.isException(value.id)) {
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
