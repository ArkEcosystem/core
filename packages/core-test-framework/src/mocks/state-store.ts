import { Stores } from "@arkecosystem/core-state";
import { Interfaces } from "@arkecosystem/crypto";

let mockBlock: Partial<Interfaces.IBlock> | undefined;
let lastHeight: number = 0;

export const setBlock = (block: Partial<Interfaces.IBlock> | undefined) => {
    mockBlock = block;
};

export const setLastHeight = (height: number) => {
    lastHeight = height;
};

class StateStoreMocks implements Partial<Stores.StateStore> {
    public getLastBlock(): Interfaces.IBlock {
        return mockBlock as Interfaces.IBlock;
    }

    public getGenesisBlock(): Interfaces.IBlock {
        return mockBlock as Interfaces.IBlock;
    }

    public getLastHeight(): number {
        return lastHeight;
    }
}

export const instance = new StateStoreMocks();
