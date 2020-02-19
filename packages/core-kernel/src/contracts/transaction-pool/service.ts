import { Interfaces } from "@arkecosystem/crypto";

export interface Service {
    getPoolSize(): number;
    clear(): void;
    rebuild(prevTransactions?: Interfaces.ITransaction[]): Promise<void>;

    addTransaction(transaction: Interfaces.ITransaction): Promise<void>;
    removeTransaction(transaction: Interfaces.ITransaction): Promise<void>;
    acceptForgedTransaction(transaction: Interfaces.ITransaction): void;
    cleanUp(): Promise<void>;
}
