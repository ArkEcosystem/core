import { Interfaces } from "@arkecosystem/crypto";

import { SenderState } from "./sender-state";

export interface Memory {
    getSize(): number;

    hasSenderState(senderPublicKey: string): boolean;
    getSenderState(senderPublicKey: string): SenderState;
    getSenderStates(): Iterable<SenderState>;

    addTransaction(transaction: Interfaces.ITransaction): Promise<void>;
    removeTransaction(transaction: Interfaces.ITransaction): Promise<Interfaces.ITransaction[]>;
    acceptForgedTransaction(transaction: Interfaces.ITransaction): Interfaces.ITransaction[];

    flush(): void;
}
