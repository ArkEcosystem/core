import { Interfaces } from "@arkecosystem/crypto";

import { SenderMempool } from "./sender-mempool";

export interface Mempool {
    getSize(): number;

    hasSenderMempool(senderPublicKey: string): boolean;
    getSenderMempool(senderPublicKey: string): SenderMempool;
    getSenderMempools(): Iterable<SenderMempool>;

    addTransaction(transaction: Interfaces.ITransaction<Interfaces.ITransactionData>): Promise<void>;
    removeTransaction(
        transaction: Interfaces.ITransaction<Interfaces.ITransactionData>,
    ): Promise<Interfaces.ITransaction<Interfaces.ITransactionData>[]>;
    acceptForgedTransaction(
        transaction: Interfaces.ITransaction<Interfaces.ITransactionData>,
    ): Promise<Interfaces.ITransaction<Interfaces.ITransactionData>[]>;

    flush(): void;
}
