export interface Storage {
    hasTransaction(id: string): boolean;
    getAllTransactions(): Iterable<{ id: string; serialized: Buffer }>;
    addTransaction(id: string, serialized: Buffer): void;
    removeTransaction(id: string): void;
    flush(): void;
}
