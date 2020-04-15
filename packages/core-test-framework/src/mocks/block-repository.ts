import { Block } from "@arkecosystem/core-database/src/models";
import { BlockRepository } from "@arkecosystem/core-database/src/repositories";
import { Contracts } from "@arkecosystem/core-kernel";

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

    public async listByExpression(
        expressions: Contracts.Shared.Expression,
        order: Contracts.Shared.ListingOrder,
        page: Contracts.Shared.ListingPage,
    ): Promise<Contracts.Shared.ListingResult<Block>> {
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
