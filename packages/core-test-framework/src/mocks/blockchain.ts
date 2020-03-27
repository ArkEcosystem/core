import { IBlock } from "@arkecosystem/crypto/src/interfaces";
import { Blockchain } from "@arkecosystem/core-blockchain";

let mockBlock: Partial<IBlock> | undefined;
let mockIsSynced: boolean = true;

export const setBlock = (block: Partial<IBlock> | undefined) => {
    mockBlock = block;
};

export const setIsSynced = (isSynced: boolean) => {
    mockIsSynced = isSynced;
};

class BlockchainMock implements Partial<Blockchain> {
    getLastBlock(): IBlock {
        return mockBlock as IBlock;
    }

    getLastHeight(): number {
        return mockBlock?.data ? mockBlock.data.height : 1;
    }

    isSynced(block?: any): boolean {
        return mockIsSynced;
    }

    async removeBlocks(nblocks: number): Promise<void> {}
}

export const instance = new BlockchainMock();
