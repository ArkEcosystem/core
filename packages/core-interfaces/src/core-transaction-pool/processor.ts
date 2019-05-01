import { Interfaces } from "@arkecosystem/crypto";

export interface IProcessor {
    validate(transactions: Interfaces.ITransactionData[]): Promise<IProcessorResult>;

    getTransactions(): Interfaces.ITransactionData[];
    getBroadcastTransactions(): Interfaces.ITransaction[];
    getErrors(): { [key: string]: ITransactionErrorResponse[] };

    pushError(transaction: Interfaces.ITransactionData, type: string, message: string): void;
}

export interface IProcessorResult {
    accept: string[];
    broadcast: string[];
    invalid: string[];
    excess: string[];
    errors: { [key: string]: ITransactionErrorResponse[] } | undefined;
}

export interface ITransactionErrorResponse {
    type: string;
    message: string;
}
