/**
 * A cache of verified blocks' ids. A block is verified if it is connected to a chain
 * in which all blocks (including that one) are signed by the corresponding delegates.
 * This is a map of { id1: true, id2: true, ... } for quick checking if a block with
 * the given id is verified.
 */
export class VerifiedBlocks {
    // Use a Set because it preserves insertion order, so that we can delete the oldest
    // entries when we are full.
    private blocks: Set<string>;
    private maxBlocksToRemember = 16384;

    constructor () {
        this.blocks = new Set();
    }

    public add(id: string) {
        if (this.blocks.size >= this.maxBlocksToRemember) {
            const oldest = this.blocks.values().next().value;
            this.blocks.delete(oldest);
        }
        this.blocks.add(id);
    }

    public has(id: string) {
        return this.blocks.has(id);
    }
}
