import { Interfaces } from "@arkecosystem/crypto";

export interface MempoolIndex {
    set(key: string, transaction: Interfaces.ITransaction): void;
    has(key: string): boolean;
    forget(key: string): void;
    clear(): void;
}
