import { Interfaces } from "@arkecosystem/crypto";

export interface AddTransactionResponse {
    transaction?: Interfaces.ITransaction;
    type?: string;
    message?: string;
}

// todo: clean this up and split the connection into entities with small responsibilities.
export interface Connection {
    boot(): Promise<this>;

    getPoolSize(): Promise<number>;
    getSenderSize(senderPublicKey: string): Promise<number>;
    addTransactions(
        transactions: Interfaces.ITransaction[],
    ): Promise<{
        added: Interfaces.ITransaction[];
        notAdded: AddTransactionResponse[];
    }>;
    acceptChainedBlock(block: Interfaces.IBlock): Promise<void>;
    buildWallets(): Promise<void>;
    replay(transactions: Interfaces.ITransaction[]): Promise<void>;
    getTransaction(id: string): Promise<Interfaces.ITransaction | undefined>;
    getTransactionIdsForForging(start: number, size: number): Promise<string[]>;
    getTransactions(start: number, size: number, maxBytes?: number): Promise<Buffer[]>;
    getTransactionsByType(type: number, typeGroup?: number): Promise<Set<Interfaces.ITransaction>>;
    getTransactionsForForging(blockSize: number): Promise<string[]>;
    has(transactionId: string): Promise<boolean>;
    hasExceededMaxTransactions(senderPublicKey: string): Promise<boolean>;
    senderHasTransactionsOfType(senderPublicKey: string, type: number, typeGroup?: number): Promise<boolean>;

    removeTransaction(transaction: Interfaces.ITransaction): void;
    removeTransactionById(id: string, senderPublicKey?: string): void;
    removeTransactionsById(ids: string[]): void;
}
