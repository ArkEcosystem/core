import { Interfaces } from "@arkecosystem/crypto";

import { TransactionModel } from "./models";

export interface TransactionModelConverter {
    getTransactionModels(transactions: Interfaces.ITransaction[]): TransactionModel[];
    getTransactionData(models: TransactionModel[]): Interfaces.ITransactionData[];
}
