import { Transaction } from "./types";
export declare type TransactionConstructor = typeof Transaction;
declare class TransactionRegistry {
    private readonly transactionTypes;
    constructor();
    registerTransactionType(constructor: TransactionConstructor): void;
    deregisterTransactionType(constructor: TransactionConstructor): void;
    private updateSchemas;
}
export declare const transactionRegistry: TransactionRegistry;
export {};
