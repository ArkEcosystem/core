import { Interfaces } from "@arkecosystem/crypto";

export interface DynamicFeeMatcher {
    canEnterPool(transaction: Interfaces.ITransaction): Promise<boolean>;
    canBroadcast(transaction: Interfaces.ITransaction): Promise<boolean>;
}
