import { TransactionPool } from "@arkecosystem/core-interfaces";
import { Interfaces } from "@arkecosystem/crypto";

export interface ITransactionsCached {
    added: Interfaces.ITransactionData[];
    notAdded: Interfaces.ITransactionData[];
}

export interface ITransactionsProcessed {
    added: Interfaces.ITransaction[];
    notAdded: TransactionPool.IAddTransactionResponse[];
}

export interface IDynamicFeeMatch {
    broadcast: boolean;
    enterPool: boolean;
}
