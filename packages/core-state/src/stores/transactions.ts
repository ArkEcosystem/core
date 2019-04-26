import { OrderedCappedMap } from "@arkecosystem/core-utils";
import { Interfaces } from "@arkecosystem/crypto";

export class TransactionStore extends OrderedCappedMap<number, Interfaces.ITransactionData> {
    public getIds(): string[] {
        return this.store
            .valueSeq()
            .reverse()
            .map((transaction: Interfaces.ITransactionData) => transaction.id)
            .toArray();
    }
}
