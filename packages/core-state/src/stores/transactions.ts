import { OrderedCappedMap } from "@arkecosystem/core-utils";
import { Interfaces } from "@arkecosystem/crypto";

export class TransactionStore extends OrderedCappedMap<string, Interfaces.ITransactionData> {
    public push(value: Interfaces.ITransactionData): void {
        this.set(value.id, value);
    }
}
