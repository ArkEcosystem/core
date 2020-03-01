import { Interfaces } from "@arkecosystem/crypto";

export interface ExpirationService {
    getTransactionExpirationHeight(transaction: Interfaces.ITransaction): number | undefined;
    isTransactionExpired(transaction: Interfaces.ITransaction): boolean;
}
