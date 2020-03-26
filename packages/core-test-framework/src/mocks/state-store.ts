import { StateStore } from "@arkecosystem/core-state/src/stores/state";
import { IBlock } from "@arkecosystem/crypto/src/interfaces";

let mockBlock: Partial<IBlock> | null;
let lastHeight: number;

export const setMockBlock = (block: Partial<IBlock> | null) => {
    mockBlock = block;
};

export const setLastHeight = (height: number) => {
    lastHeight = height;
};

export const instance: Partial<StateStore> = {
    getLastBlock: (): IBlock => {
        return mockBlock as IBlock;
    },
    getGenesisBlock: (): IBlock => {
        return mockBlock as IBlock;
    },
    getLastHeight(): number {
        return lastHeight;
    },
};
