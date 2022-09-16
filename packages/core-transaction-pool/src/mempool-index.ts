import { Interfaces } from "@arkecosystem/crypto";

export class MempoolIndex {
    private keyToTransaction: Map<string, Interfaces.ITransaction> = new Map();

    public set(key: string, transaction: Interfaces.ITransaction): void {
        this.keyToTransaction.set(key, transaction);
    }

    public has(key: string): boolean {
        return this.keyToTransaction.has(key);
    }

    public forget(key: string): void {
        this.keyToTransaction.delete(key);
    }

    public clear(): void {
        this.keyToTransaction.clear();
    }
}
