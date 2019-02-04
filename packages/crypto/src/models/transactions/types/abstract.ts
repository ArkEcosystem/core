import { TransactionTypes } from "../../../constants";
import { TransactionTypeNotImplementedError } from "../../../errors";
import { ITransactionData } from "../interfaces";

export abstract class AbstractTransaction {
    public static getType(): TransactionTypes {
        throw new TransactionTypeNotImplementedError();
    }

    public data: ITransactionData;

    public abstract serialize(): Buffer;

    public abstract deserialize(data: ITransactionData, buf: ByteBuffer): void;

    protected hasVendorField(): boolean {
        return false;
    }
}
