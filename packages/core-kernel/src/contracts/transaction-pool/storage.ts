import { Interfaces } from "@arkecosystem/crypto";

export interface Storage {
    add(transaction: Interfaces.ITransaction): void;
    delete(id: string): void;
    has(id: string): boolean;
    clear(): void;
    all(): Interfaces.ITransaction[];
}
