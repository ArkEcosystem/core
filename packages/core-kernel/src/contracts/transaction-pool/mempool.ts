import { Interfaces } from "@arkecosystem/crypto";

import { SenderMempool } from "./sender-mempool";

export interface Mempool {
    getSize(): number;

    hasSenderMempool(senderPublicKey: string): boolean;
    getSenderMempool(senderPublicKey: string): SenderMempool;
    getSenderMempools(): Iterable<SenderMempool>;

    applyBlock(block: Interfaces.IBlock): Promise<Interfaces.ITransaction[]>;
    addTransaction(transaction: Interfaces.ITransaction): Promise<void>;
    removeTransaction(senderPublicKey: string, id: string): Promise<Interfaces.ITransaction[]>;

    flush(): void;
}
