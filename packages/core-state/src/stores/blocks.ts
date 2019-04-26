import { OrderedCappedMap } from "@arkecosystem/core-utils";
import { Interfaces } from "@arkecosystem/crypto";

export class BlockStore extends OrderedCappedMap<string, Interfaces.IBlockData> {
    public push(value: Interfaces.IBlockData): void {
        this.set(value.id, value);
    }
}
