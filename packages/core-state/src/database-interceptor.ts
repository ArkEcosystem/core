import { DatabaseService } from "@arkecosystem/core-database";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

@Container.injectable()
export class DatabaseInterceptor {
    @Container.inject(Container.Identifiers.StateStore)
    private readonly stateStore!: Contracts.State.StateStore;

    @Container.inject(Container.Identifiers.DatabaseService)
    private readonly databaseService!: DatabaseService;

    public async getBlock(id: string): Promise<Interfaces.IBlock | undefined> {
        const block = this.stateStore.getLastBlocks().find((block) => block.data.id === id);

        if (block) {
            return block;
        }

        return this.databaseService.getBlock(id);
    }

    public async getCommonBlocks(ids: string[]): Promise<Interfaces.IBlockData[]> {
        let commonBlocks: Interfaces.IBlockData[] = this.stateStore.getCommonBlocks(ids);

        if (commonBlocks.length < ids.length) {
            // ! do not query blocks that were found
            // ! why method is called commonBlocks, but is just findByIds?
            commonBlocks = ((await this.databaseService.findBlockByID(ids)) as unknown) as Interfaces.IBlockData[];
        }

        return commonBlocks;
    }

    // ! three methods below (getBlocks, getBlocksForDownload, getBlocksByHeight) can be merged into one

    public async getBlocks(offset: number, limit: number, headersOnly?: boolean): Promise<Interfaces.IBlockData[]> {
        // The functions below return matches in the range [start, end], including both ends.
        const start: number = offset;
        const end: number = offset + limit - 1;

        let blocks: Interfaces.IBlockData[] = this.stateStore.getLastBlocksByHeight(start, end, headersOnly);

        if (blocks.length !== limit) {
            // ! assumes that earlier blocks may be missing
            // ! but querying database is unnecessary when later blocks are missing too (aren't forged yet)
            blocks = await this.databaseService.getBlocks(start, end, headersOnly);
        }

        return blocks;
    }

    /**
     * Get the blocks at the given heights.
     * The transactions for those blocks will not be loaded like in `getBlocks()`.
     * @param {Array} heights array of arbitrary block heights
     * @return {Array} array for the corresponding blocks. The element (block) at index `i`
     * in the resulting array corresponds to the requested height at index `i` in the input
     * array heights[]. For example, if
     * heights[0] = 100
     * heights[1] = 200
     * heights[2] = 150
     * then the result array will have the same number of elements (3) and will be:
     * result[0] = block at height 100
     * result[1] = block at height 200
     * result[2] = block at height 150
     * If some of the requested blocks do not exist in our chain (requested height is larger than
     * the height of our blockchain), then that element will be `undefined` in the resulting array
     * @throws Error
     */
    public async getBlocksByHeight(heights: number[]): Promise<Interfaces.IBlockData[]> {
        const blocks: Interfaces.IBlockData[] = [];

        // Map of height -> index in heights[], e.g. if
        // heights[5] == 6000000, then
        // toGetFromDB[6000000] == 5
        // In this map we only store a subset of the heights - the ones we could not retrieve
        // from app/state and need to get from the database.
        const toGetFromDB = {};

        for (const [i, height] of heights.entries()) {
            const stateBlocks = this.stateStore.getLastBlocksByHeight(height, height, true);

            if (Array.isArray(stateBlocks) && stateBlocks.length > 0) {
                blocks[i] = stateBlocks[0];
            }

            if (blocks[i] === undefined) {
                toGetFromDB[height] = i;
            }
        }

        const heightsToGetFromDB: number[] = Object.keys(toGetFromDB).map((height) => +height);
        if (heightsToGetFromDB.length > 0) {
            const blocksByHeights = await this.databaseService.findBlockByHeights(heightsToGetFromDB);

            for (const blockFromDB of blocksByHeights) {
                const index = toGetFromDB[blockFromDB.height];
                blocks[index] = blockFromDB;
            }
        }

        return blocks;
    }
}
