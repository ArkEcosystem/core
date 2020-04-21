import { Interfaces } from "@arkecosystem/crypto";

import { TransactionModel } from "./models";

export interface TransactionModelConverter {
    getTransactionModel(transaction: Interfaces.ITransaction): TransactionModel;
    getTransactionData(model: TransactionModel): Interfaces.ITransactionData;
}
