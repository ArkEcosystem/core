import { ITransactionData, Transaction } from "@arkecosystem/crypto";
import { ITransactionPool } from "./transaction-pool";

export interface ITransactionErrorResponse {
    type: string;
    message: string;
}

export interface IValidationResult {
    accept: string[];
    broadcast: string[];
    invalid: string[];
    excess: string[];
    errors: { [key: string]: ITransactionErrorResponse[] } | null;
}

export interface ITransactionGuard {
    pool: ITransactionPool;
    transactions: ITransactionData[];

    validate(transactions: ITransactionData[]): Promise<IValidationResult>;
    pushError(transaction: ITransactionData, type: string, message: string);

    getBroadcastTransactions(): Transaction[];
}
