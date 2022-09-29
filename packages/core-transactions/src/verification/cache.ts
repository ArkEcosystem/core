import { Container, Utils } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

@Container.injectable()
export class Cache<T> {
    protected cache: Map<string, T> = new Map();

    public clear(transaction: Interfaces.ITransactionData): void {
        this.cache.delete(this.getKey(transaction));
    }

    protected getKey(transaction: Interfaces.ITransactionData): string {
        Utils.assert.defined<string>(transaction.id);
        return transaction.id;
    }
}
