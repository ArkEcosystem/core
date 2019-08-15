import { Contracts } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

export interface ITransactionsCached {
    added: Interfaces.ITransactionData[];
    notAdded: Interfaces.ITransactionData[];
}

export interface ITransactionsProcessed {
    added: Interfaces.ITransaction[];
    notAdded: Contracts.TransactionPool.IAddTransactionResponse[];
}

export interface IDynamicFeeMatch {
    broadcast: boolean;
    enterPool: boolean;
}
