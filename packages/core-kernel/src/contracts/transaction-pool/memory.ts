import { Interfaces } from "@arkecosystem/crypto";

import { SenderState } from "./sender-state";

export interface Memory {
    getSize(): number;
    clear(): void;

    hasSenderState(senderPublicKey: string): boolean;
    getSenderState(senderPublicKey: string): SenderState;
    getSenderStates(): Iterable<SenderState>;

    apply(transaction: Interfaces.ITransaction): Promise<void>;
    remove(transaction: Interfaces.ITransaction): Promise<Interfaces.ITransaction[]>;
    accept(transaction: Interfaces.ITransaction): Interfaces.ITransaction[];
}
