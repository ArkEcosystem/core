import { ITransactionData, SchemaError } from "../../../interfaces";
import { One } from "../index";

export class TransferTransaction<
    T,
    U extends ITransactionData = ITransactionData,
    E = SchemaError
> extends One.TransferTransaction<T, U, E> {
    public static version: number = 2;
}
