import { Repositories } from "@arkecosystem/core-database";

export type DelegateForgedBlock = {
    generatorPublicKey: string;
    totalRewards: string;
    totalFees: string;
    totalProduced: number;
};
export type LastForgedBlock = { id: string; height: string; generatorPublicKey: string; timestamp: number };

let mockDelegatesForgedBlocks: DelegateForgedBlock[] = [];
let mockLastForgedBlocks: LastForgedBlock[] = [];

export const setDelegateForgedBlocks = (blocks: DelegateForgedBlock[]) => {
    mockDelegatesForgedBlocks = blocks;
};

export const setLastForgedBlocks = (blocks: LastForgedBlock[]) => {
    mockLastForgedBlocks = blocks;
};

class BlockRepositoryMock implements Partial<Repositories.BlockRepository> {
    public async getDelegatesForgedBlocks() {
        return mockDelegatesForgedBlocks;
    }

    public async getLastForgedBlocks() {
        return mockLastForgedBlocks;
    }
}

export const instance = new BlockRepositoryMock();
