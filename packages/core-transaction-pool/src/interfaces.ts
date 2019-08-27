import { Contracts } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

export interface TransactionsCached {
    added: Interfaces.ITransactionData[];
    notAdded: Interfaces.ITransactionData[];
}

export interface TransactionsProcessed {
    added: Interfaces.ITransaction[];
    notAdded: Contracts.TransactionPool.AddTransactionResponse[];
}

export interface DynamicFeeMatch {
    broadcast: boolean;
    enterPool: boolean;
}
