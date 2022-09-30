import { Interfaces } from "@arkecosystem/crypto";

export interface Service {
    getPoolSize(): number;

    applyBlock(block: Interfaces.IBlock): Promise<void>;
    addTransaction(transaction: Interfaces.ITransaction): Promise<void>;
    readdTransactions(previouslyForgedTransactions?: Interfaces.ITransaction[]): Promise<void>;
    removeTransaction(transaction: Interfaces.ITransaction): Promise<void>;
    cleanUp(): Promise<void>;
    flush(): Promise<void>;
}
