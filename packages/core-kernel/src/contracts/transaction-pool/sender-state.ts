import { Interfaces } from "@arkecosystem/crypto";

export interface SenderState {
    getTransactionsCount(): number;
    getTransactionsFromEarliestNonce(): Iterable<Interfaces.ITransaction>;
    getTransactionsFromLatestNonce(): Iterable<Interfaces.ITransaction>;

    addTransaction(transaction: Interfaces.ITransaction): Promise<void>;
    popTransaction(): Promise<Interfaces.ITransaction>;
    removeTransaction(transaction: Interfaces.ITransaction): Promise<Interfaces.ITransaction[]>;
    acceptForgedTransaction(transaction: Interfaces.ITransaction): Interfaces.ITransaction[];
}

export type SenderStateFactory = () => SenderState;
