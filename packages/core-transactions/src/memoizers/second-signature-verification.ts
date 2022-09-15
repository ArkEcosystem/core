import { Container } from "@arkecosystem/core-kernel";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import LRUCache from "lru-cache";

@Container.injectable()
export class SecondSignatureVerificationMemoizer {
    private lruCache = new LRUCache<string, boolean>({ max: 2 });

    public verifySecondSignature(transaction: Interfaces.ITransactionData, publicKey: string): boolean {
        const key = this.getKey(transaction, publicKey);

        if (this.lruCache.has(key)) {
            return this.lruCache.get(key)!;
        }

        const result = Transactions.Verifier.verifySecondSignature(transaction, publicKey);

        this.lruCache.set(key, result);

        return result;
    }

    public clear() {
        this.lruCache.clear();
    }

    private getKey(transaction: Interfaces.ITransactionData, publicKey: string): string {
        if (!transaction.id) {
            throw new Error("Missing transaction id");
        }

        return `${transaction.id}${publicKey}`;
    }
}
