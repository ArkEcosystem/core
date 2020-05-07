import { Interfaces } from "@arkecosystem/crypto";

export interface SenderMempool {
    isEmpty(): boolean;
    getSize(): number;

    getFromEarliest(): Iterable<Interfaces.ITransaction<Interfaces.ITransactionData>>;
    getFromLatest(): Iterable<Interfaces.ITransaction<Interfaces.ITransactionData>>;

    addTransaction(transaction: Interfaces.ITransaction<Interfaces.ITransactionData>): Promise<void>;
    removeTransaction(
        transaction: Interfaces.ITransaction<Interfaces.ITransactionData>,
    ): Promise<Interfaces.ITransaction<Interfaces.ITransactionData>[]>;
    acceptForgedTransaction(
        transaction: Interfaces.ITransaction<Interfaces.ITransactionData>,
    ): Promise<Interfaces.ITransaction<Interfaces.ITransactionData>[]>;
}

export type SenderMempoolFactory = () => SenderMempool;
