import { models } from "@arkecosystem/crypto";

export const isBlockChained = (previousBlock: models.IBlock, nextBlock: models.IBlock): boolean => {
    const followsPrevious = nextBlock.data.previousBlock === previousBlock.data.id;
    const isFuture = nextBlock.data.timestamp > previousBlock.data.timestamp;
    const isPlusOne = nextBlock.data.height === previousBlock.data.height + 1;

    return followsPrevious && isFuture && isPlusOne;
};
