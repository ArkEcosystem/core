import { IBlock } from "@arkecosystem/crypto/src/interfaces";
import { Blockchain } from "@arkecosystem/core-blockchain";

let mockBlock: Partial<IBlock> | null;
let mockIsSynced: boolean = true;

export const setMockBlock = (block: Partial<IBlock> | null) => {
    mockBlock = block;
};

export const setIsSynced = (isSynced: boolean) => {
    mockIsSynced = isSynced;
};

export const blockchain: Partial<Blockchain> = {
    getLastBlock: () :IBlock => {
        return mockBlock as IBlock;
    },
    getLastHeight: (): number => {
        return mockBlock?.data ? mockBlock.data.height : 1;
    },
    isSynced: (block?: any): boolean => {
        return mockIsSynced;
    }
};
