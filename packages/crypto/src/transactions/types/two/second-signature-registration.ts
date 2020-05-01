import { ITransactionData } from "../../../interfaces";
import { One } from "../index";

export class SecondSignatureRegistrationTransaction<
    T,
    U extends ITransactionData,
    E
> extends One.SecondSignatureRegistrationTransaction<T, U, E> {
    public static version: number = 2;
}
