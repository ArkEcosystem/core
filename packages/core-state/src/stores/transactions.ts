import { Interfaces } from "@arkecosystem/crypto";
import { AbstractStore } from "./store";

export class TransactionStore extends AbstractStore<string, Interfaces.ITransactionData> {
    public set(value: Interfaces.ITransactionData): void {
        this.store.set(value.id, value);
    }
}
