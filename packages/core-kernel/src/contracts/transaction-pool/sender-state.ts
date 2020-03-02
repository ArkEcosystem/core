import { Interfaces } from "@arkecosystem/crypto";

export interface SenderState {
    isEmpty(): boolean;
    getTransactionsCount(): number;
    getTransactionsFromEarliestNonce(): Iterable<Interfaces.ITransaction>;
    getTransactionsFromLatestNonce(): Iterable<Interfaces.ITransaction>;

    addTransaction(transaction: Interfaces.ITransaction): Promise<void>;
    removeTransaction(transaction: Interfaces.ITransaction): Promise<Interfaces.ITransaction[]>;
    acceptForgedTransaction(transaction: Interfaces.ITransaction): Promise<Interfaces.ITransaction[]>;
}

export type SenderStateFactory = () => SenderState;
