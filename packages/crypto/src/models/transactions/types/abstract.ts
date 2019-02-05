import { JoiObject } from "joi";
import { TransactionRepository } from "..";
import { TransactionTypes } from "../../../constants";
import { crypto } from "../../../crypto";
import { TransactionDeserializer } from "../../../deserializers";
import { TransactionTypeNotImplementedError } from "../../../errors";
import { TransactionSerializer } from "../../../serializers";
import { isException } from "../../../utils";
import { ITransactionData } from "../interfaces";

export abstract class AbstractTransaction {
    public static getType(): TransactionTypes {
        throw new TransactionTypeNotImplementedError();
    }

    public static from(data: ITransactionData) {
        const transaction = TransactionRepository.create(data);
        transaction.serialized = TransactionSerializer.serialize(data);
        transaction.data = TransactionDeserializer.deserialize(transaction.serialized.toString("hex"));

        transaction.verify();

        return transaction;
    }

    public data: ITransactionData;
    public serialized: Buffer;

    public abstract serialize(): Buffer;

    public abstract deserialize(buf: ByteBuffer): void;

    public abstract canBeApplied(wallet): boolean;

    public verify(): boolean {
        const { data } = this;
        if (isException(data)) {
            return true;
        }

        if (data.type >= 4) {
            return false;
        }

        return crypto.verify(data);
    }

    protected hasVendorField(): boolean {
        return false;
    }
}
