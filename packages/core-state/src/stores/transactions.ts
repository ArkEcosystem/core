import { Utils } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

export class TransactionStore extends Utils.OrderedCappedMap<string, Interfaces.ITransactionData> {
    public push(value: Interfaces.ITransactionData): void {
        this.set(value.id, value);
    }
}
