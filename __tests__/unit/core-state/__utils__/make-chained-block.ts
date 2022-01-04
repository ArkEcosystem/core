import { Interfaces } from "@packages/crypto";

export const makeChainedBlocks = (length: number, blockFactory): Interfaces.IBlock[] => {
    const entitites: Interfaces.IBlock[] = [];
    let previousBlock; // first case uses genesis IBlockData
    const getPreviousBlock = () => previousBlock;

    for (let i = 0; i < length; i++) {
        if (previousBlock) {
            blockFactory.withOptions({ getPreviousBlock });
        }
        const entity: Interfaces.IBlock = blockFactory.make();
        entitites.push(entity);
        previousBlock = entity.data;
    }
    return entitites;
};
