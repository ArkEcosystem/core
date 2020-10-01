import { Blockchain } from "@arkecosystem/core-blockchain";
import { Interfaces } from "@arkecosystem/crypto";

let mockBlock: Partial<Interfaces.IBlock> | undefined;
let mockIsSynced: boolean = true;

export const setBlock = (block: Partial<Interfaces.IBlock> | undefined) => {
    mockBlock = block;
};

export const setIsSynced = (isSynced: boolean) => {
    mockIsSynced = isSynced;
};

class BlockchainMock implements Partial<Blockchain> {
    public getLastBlock(): Interfaces.IBlock {
        return mockBlock as Interfaces.IBlock;
    }

    public getLastHeight(): number {
        return mockBlock?.data ? mockBlock.data.height : 1;
    }

    public isSynced(block?: any): boolean {
        return mockIsSynced;
    }

    public async removeBlocks(nblocks: number): Promise<void> {}
}

export const instance = new BlockchainMock();
