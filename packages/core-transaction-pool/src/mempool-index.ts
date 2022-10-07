import { Contracts, Utils } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

export class MempoolIndex implements Contracts.TransactionPool.MempoolIndex {
    private keyToTransaction: Map<string, Interfaces.ITransaction> = new Map();

    public set(key: string, transaction: Interfaces.ITransaction): void {
        this.keyToTransaction.set(key, transaction);
    }

    public has(key: string): boolean {
        return this.keyToTransaction.has(key);
    }

    public get(key: string): Interfaces.ITransaction {
        const transaction = this.keyToTransaction.get(key);
        Utils.assert.defined<Interfaces.ITransaction>(transaction);

        return transaction;
    }

    public forget(key: string): void {
        this.keyToTransaction.delete(key);
    }

    public clear(): void {
        this.keyToTransaction.clear();
    }
}
