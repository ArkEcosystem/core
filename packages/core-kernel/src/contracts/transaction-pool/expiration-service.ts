import { Interfaces } from "@arkecosystem/crypto";

export interface ExpirationService {
    getTransactionExpiredBlocksCount(transaction: Interfaces.ITransaction): number;
    isTransactionExpired(transaction: Interfaces.ITransaction): boolean;
}
