import { ITransactionData } from "../../../interfaces";
import { One } from "../index";

export class TransferTransaction<T, U extends ITransactionData, E> extends One.TransferTransaction<T, U, E> {
    public static version: number = 2;
}
