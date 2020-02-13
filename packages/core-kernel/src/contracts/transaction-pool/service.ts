import { Interfaces } from "@arkecosystem/crypto";

export interface Service {
    size: number;

    boot(): Promise<void>;
    clear(): void;
    rebuild(): Promise<void>;
    replay(transactions: Interfaces.ITransaction[]): Promise<void>;

    add(transaction: Interfaces.ITransaction): Promise<void>;
    remove(transaction: Interfaces.ITransaction): Promise<void>;
    accept(transaction: Interfaces.ITransaction): void;
    clean(): Promise<void>;
}
