import { Interfaces } from "@arkecosystem/core-crypto";
import { StateStore } from "@arkecosystem/core-state/src/stores/state";

let mockBlock: Partial<Interfaces.IBlock> | undefined;
let lastHeight: number = 0;

export const setBlock = (block: Partial<Interfaces.IBlock> | undefined) => {
    mockBlock = block;
};

export const setLastHeight = (height: number) => {
    lastHeight = height;
};

class StateStoreMocks implements Partial<StateStore> {
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
