import { Interfaces } from "@arkecosystem/crypto";
import { AbstractStore } from "./store";

export class BlockStore extends AbstractStore<string, Interfaces.IBlockData> {
    public set(value: Interfaces.IBlockData): void {
        this.store.set(value.id, value);
    }
}
