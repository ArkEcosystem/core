import { ITransactionData, Transaction } from "@arkecosystem/crypto";

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
    validate(transactions: ITransactionData[]): Promise<IValidationResult>;

    getBroadcastTransactions(): Transaction[];
}
