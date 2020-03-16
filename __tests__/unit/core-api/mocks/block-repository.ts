import { BlockRepository, RepositorySearchResult } from "@packages/core-database/src/repositories";
import { Block } from "@packages/core-database/src/models";

let mockBlock: any | null;
let mockBlocks: Partial<Block>[];

export const setMockBlock = (block: any | null) => {
    mockBlock = block;
};

export const setMockBlocks = (blocks: Partial<Block>[]) => {
    mockBlocks = blocks;
};

export const blockRepository: Partial<BlockRepository> = {
    searchByQuery: async (query: any, pagination: any): Promise<RepositorySearchResult<Block>> => {
        return {
            rows: mockBlocks as Block[],
            count: mockBlocks.length,
            countIsEstimate: false
        }
    },
    findByIdOrHeight: async (idOrHeight: any): Promise<Block> => {
        return mockBlock as Block
    },
    search: async (filter: any): Promise<RepositorySearchResult<Block>> => {
        return {
            rows: mockBlocks as Block[],
            count: mockBlocks.length,
            countIsEstimate: false
        }
    }
};
