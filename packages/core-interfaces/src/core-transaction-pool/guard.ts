import { interfaces, Transaction } from "@arkecosystem/crypto";
import { IConnection } from "./connection";

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

export interface IGuard {
    pool: IConnection;
    transactions: interfaces.ITransactionData[];

    validate(transactions: interfaces.ITransactionData[]): Promise<IValidationResult>;
    pushError(transaction: interfaces.ITransactionData, type: string, message: string);

    getBroadcastTransactions(): Transaction[];
}
