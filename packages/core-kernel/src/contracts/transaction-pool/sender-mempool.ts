import { Interfaces } from "@arkecosystem/crypto";

export interface SenderMempool {
    isDisposable(): boolean;
    getSize(): number;

    getFromEarliest(): Iterable<Interfaces.ITransaction>;
    getFromLatest(): Iterable<Interfaces.ITransaction>;

    addTransaction(transaction: Interfaces.ITransaction): Promise<void>;
    removeTransaction(id: string): Promise<Interfaces.ITransaction[]>;
    removeForgedTransaction(id: string): Promise<Interfaces.ITransaction[]>;
}

export type SenderMempoolFactory = () => SenderMempool;
