import { Interfaces } from "@arkecosystem/crypto";

export interface ExpirationService {
    canExpire(transaction: Interfaces.ITransaction): boolean;
    isExpired(transaction: Interfaces.ITransaction): boolean;
    getExpirationHeight(transaction: Interfaces.ITransaction): number;
}
