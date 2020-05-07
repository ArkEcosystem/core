import { Interfaces } from "@arkecosystem/crypto";

export interface ExpirationService {
    canExpire(transaction: Interfaces.ITransaction<Interfaces.ITransactionData>): boolean;
    isExpired(transaction: Interfaces.ITransaction<Interfaces.ITransactionData>): boolean;
    getExpirationHeight(transaction: Interfaces.ITransaction<Interfaces.ITransactionData>): number;
}
