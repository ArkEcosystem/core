import { ITransactionData, SchemaError } from "../../../interfaces";
import { One } from "../index";

export class VoteTransaction<
    T,
    U extends ITransactionData = ITransactionData,
    E = SchemaError
> extends One.VoteTransaction<T, U, E> {
    public static version: number = 2;
}
