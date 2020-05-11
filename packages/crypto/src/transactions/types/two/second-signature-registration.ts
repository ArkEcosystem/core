import { ITransactionData, SchemaError } from "../../../interfaces";
import { One } from "../index";

export class SecondSignatureRegistrationTransaction<
    T,
    U extends ITransactionData = ITransactionData,
    E = SchemaError
> extends One.SecondSignatureRegistrationTransaction<T, U, E> {
    public static version: number = 2;
}
