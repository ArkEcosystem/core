import { Interfaces } from "@arkecosystem/crypto";

export interface Service {
    getPoolSize(): number;

    addTransaction(transaction: Interfaces.ITransaction<Interfaces.ITransactionData>): Promise<void>;
    removeTransaction(transaction: Interfaces.ITransaction<Interfaces.ITransactionData>): Promise<void>;
    acceptForgedTransaction(transaction: Interfaces.ITransaction<Interfaces.ITransactionData>): Promise<void>;
    readdTransactions(prevTransactions?: Interfaces.ITransaction<Interfaces.ITransactionData>[]): Promise<void>;
    cleanUp(): Promise<void>;
    flush(): void;
}
