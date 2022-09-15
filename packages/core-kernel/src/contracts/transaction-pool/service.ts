import { Interfaces } from "@arkecosystem/crypto";

export interface Service {
    getPoolSize(): number;

    addTransaction(transaction: Interfaces.ITransaction): Promise<void>;
    readdTransactionsFromStore(previouslyForgedTransactions?: Interfaces.ITransaction[]): Promise<void>;
    readdTransactionsFromMempool(): Promise<void>;
    removeTransaction(transaction: Interfaces.ITransaction): Promise<void>;
    removeForgedTransaction(transaction: Interfaces.ITransaction): Promise<void>;
    cleanUp(): Promise<void>;
    flush(): Promise<void>;
}
