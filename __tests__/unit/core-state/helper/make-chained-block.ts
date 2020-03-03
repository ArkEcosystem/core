import { IBlock } from "@packages/crypto/src/interfaces";

export const makeChainedBlocks = (length: number, blockFactory): IBlock[] => {
    const entitites: IBlock[] = [];
    let previousBlock; // first case uses genesis IBlockData
    const getPreviousBlock = () => previousBlock;

    for (let i = 0; i < length; i++) {
        if (previousBlock) {
            blockFactory.withOptions({ getPreviousBlock });
        }
        const entity: IBlock = blockFactory.make();
        entitites.push(entity);
        previousBlock = entity.data;
    }
    return entitites;
};
