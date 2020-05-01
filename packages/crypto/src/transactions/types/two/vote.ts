import { ITransactionData } from "../../../interfaces";
import { One } from "../index";

export class VoteTransaction<T, U extends ITransactionData, E> extends One.VoteTransaction<T, U, E> {
    public static version: number = 2;
}
