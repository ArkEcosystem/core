import { OrderedCappedMap } from "@arkecosystem/core-utils";
import { Interfaces } from "@arkecosystem/crypto";

export class BlockStore extends OrderedCappedMap<number, Interfaces.IBlockData> {
    public getIds(): string[] {
        return this.store
            .valueSeq()
            .reverse()
            .map((block: Interfaces.IBlockData) => block.id)
            .toArray();
    }

    public lastHeight(): number {
        return this.last().height;
    }
}
