import { TransactionPool } from "@arkecosystem/core-interfaces";
import { Interfaces } from "@arkecosystem/crypto";
/**
 * @TODO: this class has too many responsibilities at the moment.
 * Its sole responsibility should be to validate transactions and return them.
 */
export declare class Processor implements TransactionPool.IProcessor {
    private readonly pool;
    private transactions;
    private readonly excess;
    private readonly accept;
    private readonly broadcast;
    private readonly invalid;
    private readonly errors;
    constructor(pool: TransactionPool.IConnection);
    validate(transactions: Interfaces.ITransactionData[]): Promise<TransactionPool.IProcessorResult>;
    getTransactions(): Interfaces.ITransactionData[];
    getBroadcastTransactions(): Interfaces.ITransaction[];
    getErrors(): {
        [key: string]: TransactionPool.ITransactionErrorResponse[];
    };
    pushError(transaction: Interfaces.ITransactionData, type: string, message: string): void;
    private cacheTransactions;
    private removeForgedTransactions;
    private filterAndTransformTransactions;
    private validateTransaction;
    private addTransactionsToPool;
    private printStats;
}
