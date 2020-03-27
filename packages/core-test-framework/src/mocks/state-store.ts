import { StateStore } from "@arkecosystem/core-state/src/stores/state";
import { IBlock } from "@arkecosystem/crypto/src/interfaces";

let mockBlock: Partial<IBlock> | undefined;
let lastHeight: number = 0;

export const setBlock = (block: Partial<IBlock> | undefined) => {
    mockBlock = block;
};

export const setLastHeight = (height: number) => {
    lastHeight = height;
};

class StateStoreMocks implements Partial<StateStore> {
    public getLastBlock(): IBlock {
        return mockBlock as IBlock;
    }

    public getGenesisBlock(): IBlock {
        return mockBlock as IBlock;
    }

    public getLastHeight(): number {
        return lastHeight;
    }
}

export const instance = new StateStoreMocks();
