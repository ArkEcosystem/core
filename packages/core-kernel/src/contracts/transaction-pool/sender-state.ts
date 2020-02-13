import { Interfaces } from "@arkecosystem/crypto";

export interface SenderState {
    size: number;
    getFromEarliestNonce(): Iterable<Interfaces.ITransaction>;
    getFromLatestNonce(): Iterable<Interfaces.ITransaction>;

    apply(transaction: Interfaces.ITransaction): Promise<void>;
    revert(): Promise<Interfaces.ITransaction>;
    remove(transaction: Interfaces.ITransaction): Promise<Interfaces.ITransaction[]>;
    accept(transaction: Interfaces.ITransaction): Interfaces.ITransaction[];
}

export type SenderStateFactory = () => SenderState;
