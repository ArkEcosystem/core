import { Enums, Interfaces } from "@arkecosystem/crypto";
import { Dayjs } from "dayjs";
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
    getPoolSize(): number;
    getSenderSize(senderPublicKey: string): number;
    addTransactions(
        transactions: Interfaces.ITransaction[],
    ): {
        added: Interfaces.ITransaction[];
        notAdded: IAddTransactionResponse[];
    };
    acceptChainedBlock(block: Interfaces.IBlock): void;
    blockSender(senderPublicKey: string): Dayjs;
    buildWallets(): Promise<void>;
    flush(): void;
    getTransaction(id: string): Interfaces.ITransaction;
    getTransactionIdsForForging(start: number, size: number): Promise<string[]>;
    getTransactions(start: number, size: number, maxBytes?: number): Promise<Buffer[]>;
    getTransactionsByType(type: any): any;
    getTransactionsForForging(blockSize: number): Promise<string[]>;
    has(transactionId: string): any;
    hasExceededMaxTransactions(senderPublicKey: string): boolean;
    isSenderBlocked(senderPublicKey: string): boolean;
    purgeByPublicKey(senderPublicKey: string): void;
    removeTransaction(transaction: Interfaces.ITransaction): void;
    removeTransactionById(id: string, senderPublicKey?: string): void;
    removeTransactionsById(ids: string[]): void;
    removeTransactionsForSender(senderPublicKey: string): void;
    senderHasTransactionsOfType(senderPublicKey: string, transactionType: Enums.TransactionTypes): boolean;
}
