import { Enums, Interfaces } from "@arkecosystem/crypto";
import { IProcessor } from "./processor";

export interface IAddTransactionResponse {
    transaction?: Interfaces.ITransaction;
    type?: string;
    message?: string;
}

export interface IConnection {
    walletManager: any;

    makeProcessor(): IProcessor;

    make(): Promise<this>;
    disconnect(): void;
    getPoolSize(): Promise<number>;
    getSenderSize(senderPublicKey: string): Promise<number>;
    addTransactions(
        transactions: Interfaces.ITransaction[],
    ): Promise<{
        added: Interfaces.ITransaction[];
        notAdded: IAddTransactionResponse[];
    }>;
    acceptChainedBlock(block: Interfaces.IBlock): void;
    buildWallets(): Promise<void>;
    flush(): void;
    getTransaction(id: string): Promise<Interfaces.ITransaction>;
    getTransactionIdsForForging(start: number, size: number): Promise<string[]>;
    getTransactions(start: number, size: number, maxBytes?: number): Promise<Buffer[]>;
    getTransactionsByType(type: any): Promise<Set<Interfaces.ITransaction>>;
    getTransactionsForForging(blockSize: number): Promise<string[]>;
    has(transactionId: string): Promise<boolean>;
    hasExceededMaxTransactions(senderPublicKey: string): Promise<boolean>;
    purgeByPublicKey(senderPublicKey: string): void;
    removeTransaction(transaction: Interfaces.ITransaction): void;
    removeTransactionById(id: string, senderPublicKey?: string): void;
    removeTransactionsById(ids: string[]): void;
    removeTransactionsForSender(senderPublicKey: string): void;
    senderHasTransactionsOfType(senderPublicKey: string, transactionType: Enums.TransactionType): Promise<boolean>;
}
