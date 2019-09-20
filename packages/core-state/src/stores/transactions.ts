import { Container, Utils } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

@Container.injectable()
export class TransactionStore extends Utils.CappedMap<string, Interfaces.ITransactionData> {
    public push(value: Interfaces.ITransactionData): void {
        this.set(value.id, value);
    }
}
