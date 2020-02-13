import { Interfaces } from "@arkecosystem/crypto";

export interface Storage {
    add(transaction: Interfaces.ITransaction): void;
    delete(transaction: Interfaces.ITransaction): void;
    has(transaction: Interfaces.ITransaction): boolean;
    clear(): void;
    all(): Interfaces.ITransaction[];
}
