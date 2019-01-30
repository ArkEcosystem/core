import { models } from "@arkecosystem/crypto";

export interface TransactionErrorDTO {
    type: string;
    message: string;
}

export interface ValidationResultDTO {
    accept: string[];
    broadcast: string[];
    invalid: string[];
    excess: string[];
    errors: { [key: string]: TransactionErrorDTO[] } | null;
}

export interface ITransactionGuard {
    validate(transactions: models.Transaction[]): Promise<ValidationResultDTO>;

    getBroadcastTransactions(): models.Transaction[];
}
