import { Interfaces } from "@arkecosystem/crypto";

// todo: clean this up and split the connection into entities with small responsibilities.
export interface Connection {
    boot(): Promise<this>;

    getPoolSize(): Promise<number>;
    getSenderSize(senderPublicKey: string): Promise<number>;
    addTransaction(transaction: Interfaces.ITransaction): Promise<void>;
    acceptChainedBlock(block: Interfaces.IBlock): Promise<void>;
    buildWallets(): Promise<void>;
    replay(transactions: Interfaces.ITransaction[]): Promise<void>;
    getTransaction(id: string): Promise<Interfaces.ITransaction | undefined>;
    getTransactions(start: number, size: number): Promise<Interfaces.ITransaction[]>;
    has(transactionId: string): Promise<boolean>;

    removeTransaction(transaction: Interfaces.ITransaction): void;
    removeTransactionById(id: string, senderPublicKey?: string): void;
    removeTransactionsById(ids: string[]): void;
}
