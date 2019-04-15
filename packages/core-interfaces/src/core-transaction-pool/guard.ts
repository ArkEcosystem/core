import { Interfaces } from "@arkecosystem/crypto";
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
    transactions: Interfaces.ITransactionData[];

    validate(transactions: Interfaces.ITransactionData[]): Promise<IValidationResult>;
    pushError(transaction: Interfaces.ITransactionData, type: string, message: string);

    getBroadcastTransactions(): Interfaces.ITransaction[];
}
