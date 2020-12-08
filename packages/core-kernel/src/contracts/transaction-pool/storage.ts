export type StoredTransaction = {
    height: number;
    id: string;
    senderPublicKey: string;
    serialized: Buffer;
};

export interface Storage {
    addTransaction(storedTransaction: StoredTransaction): void;
    hasTransaction(id: string): boolean;
    getAllTransactions(): Iterable<StoredTransaction>;
    getOldTransactions(height: number): Iterable<StoredTransaction>;
    removeTransaction(id: string): void;
    flush(): void;
}
