import { Interfaces } from "@arkecosystem/crypto";

export interface Collator {
    getBlockCandidateTransactions(): Promise<Interfaces.ITransaction[]>;
}
