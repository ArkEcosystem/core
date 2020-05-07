import { Interfaces } from "@arkecosystem/crypto";

export interface DynamicFeeMatcher {
    canEnterPool(transaction: Interfaces.ITransaction<Interfaces.ITransactionData>): Promise<boolean>;
    canBroadcast(transaction: Interfaces.ITransaction<Interfaces.ITransactionData>): Promise<boolean>;
}
