import { Interfaces } from "@arkecosystem/crypto";

export interface SenderState {
    apply(transaction: Interfaces.ITransaction<Interfaces.ITransactionData>): Promise<void>;
    revert(transaction: Interfaces.ITransaction<Interfaces.ITransactionData>): Promise<void>;
}
