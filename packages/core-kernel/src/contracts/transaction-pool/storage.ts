import { Interfaces } from "@arkecosystem/crypto";

export interface Storage {
    hasTransaction(id: string): boolean;
    getAllTransactions(): Iterable<Interfaces.ITransaction<Interfaces.ITransactionData>>;
    addTransaction(transaction: Interfaces.ITransaction<Interfaces.ITransactionData>): void;
    removeTransaction(id: string): void;
    flush(): void;
}
