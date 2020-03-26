import { BlockRepository, RepositorySearchResult } from "@arkecosystem/core-database/src/repositories";
import { Block } from "@arkecosystem/core-database/src/models";

type DelegateForgedBlock = { generatorPublicKey: string; totalRewards: string; totalFees: string; totalProduced: number }
type LastForgedBlock = { id: string; height: string; generatorPublicKey: string; timestamp: number }

let mockBlock: any | null;
let mockBlocks: Partial<Block>[];
let mockDelegatesForgedBlocks: DelegateForgedBlock[] = [];
let mockLastForgedBlocks: LastForgedBlock[] = [];

export const setMockBlock = (block: Partial<Block> | null) => {
    mockBlock = block;
};

export const setMockBlocks = (blocks: Partial<Block>[]) => {
    mockBlocks = blocks;
};

export const setDelegateForgedBlocks = (blocks: DelegateForgedBlock[]) => {
    mockDelegatesForgedBlocks = blocks;
};

export const setLastForgedBlocks = (blocks: LastForgedBlock[]) => {
    mockLastForgedBlocks = blocks;
};

export const instance: Partial<BlockRepository> = {
    findByIdOrHeight: async (idOrHeight: any): Promise<Block> => {
        return mockBlock as Block;
    },
    getDelegatesForgedBlocks: async () => {
        return mockDelegatesForgedBlocks
    },
    getLastForgedBlocks: async () => {
        return mockLastForgedBlocks
    },
    search: async (filter: any): Promise<RepositorySearchResult<Block>> => {
        return {
            rows: mockBlocks as Block[],
            count: mockBlocks.length,
            countIsEstimate: false,
        };
    },
    searchByQuery: async (query: any, pagination: any): Promise<RepositorySearchResult<Block>> => {
        return {
            rows: mockBlocks as Block[],
            count: mockBlocks.length,
            countIsEstimate: false,
        };
    },
};
