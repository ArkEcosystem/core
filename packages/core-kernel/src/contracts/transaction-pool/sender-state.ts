import { Interfaces } from "@arkecosystem/crypto";

export interface SenderState {
    getTransactionsCount(): number;
    getTransactionsFromEarliestNonce(): Iterable<Interfaces.ITransaction>;
    getTransactionsFromLatestNonce(): Iterable<Interfaces.ITransaction>;

    apply(transaction: Interfaces.ITransaction): Promise<void>;
    revert(): Promise<Interfaces.ITransaction>;
    remove(transaction: Interfaces.ITransaction): Promise<Interfaces.ITransaction[]>;
    accept(transaction: Interfaces.ITransaction): Interfaces.ITransaction[];
}

export type SenderStateFactory = () => SenderState;
