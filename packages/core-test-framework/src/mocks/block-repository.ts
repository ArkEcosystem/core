import { Block } from "@arkecosystem/core-database/src/models";
import { BlockRepository, RepositorySearchResult } from "@arkecosystem/core-database/src/repositories";
import { SearchFilter, SearchPagination } from "@arkecosystem/core-database/src/repositories/search";

export type DelegateForgedBlock = {
    generatorPublicKey: string;
    totalRewards: string;
    totalFees: string;
    totalProduced: number;
};
export type LastForgedBlock = { id: string; height: string; generatorPublicKey: string; timestamp: number };

let mockBlock: Partial<Block> | undefined;
let mockBlocks: Partial<Block>[] = [];
let mockDelegatesForgedBlocks: DelegateForgedBlock[] = [];
let mockLastForgedBlocks: LastForgedBlock[] = [];

export const setBlock = (block: Partial<Block> | undefined) => {
    mockBlock = block;
};

export const setBlocks = (blocks: Partial<Block>[]) => {
    mockBlocks = blocks;
};

export const setDelegateForgedBlocks = (blocks: DelegateForgedBlock[]) => {
    mockDelegatesForgedBlocks = blocks;
};

export const setLastForgedBlocks = (blocks: LastForgedBlock[]) => {
    mockLastForgedBlocks = blocks;
};

class BlockRepositoryMock implements Partial<BlockRepository> {
    public async findByIdOrHeight(idOrHeight: string | number): Promise<Block> {
        return mockBlock as Block;
    }

    public async search(filter: SearchFilter): Promise<RepositorySearchResult<Block>> {
        return {
            rows: mockBlocks as Block[],
            count: mockBlocks.length,
            countIsEstimate: false,
        };
    }

    public async searchByQuery(
        query: Record<string, any>,
        pagination: SearchPagination,
    ): Promise<RepositorySearchResult<Block>> {
        return {
            rows: mockBlocks as Block[],
            count: mockBlocks.length,
            countIsEstimate: false,
        };
    }

    public async getDelegatesForgedBlocks() {
        return mockDelegatesForgedBlocks;
    }

    public async getLastForgedBlocks() {
        return mockLastForgedBlocks;
    }
}

export const instance = new BlockRepositoryMock();
