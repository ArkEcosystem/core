import { ITransactionData, SchemaError } from "@packages/crypto/src/interfaces";

import { One } from "../index";

export class DelegateRegistrationTransaction<
    T,
    U extends ITransactionData = ITransactionData,
    E = SchemaError
> extends One.DelegateRegistrationTransaction<T, U, E> {
    public static version: number = 2;
}
