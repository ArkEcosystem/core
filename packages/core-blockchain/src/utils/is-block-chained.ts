import { models, slots } from "@arkecosystem/crypto";

export const isBlockChained = (previousBlock: models.IBlock, nextBlock: models.IBlock): boolean => {
    const followsPrevious = nextBlock.data.previousBlock === previousBlock.data.id;
    const isPlusOne = nextBlock.data.height === previousBlock.data.height + 1;

    const previousSlot = slots.getSlotNumber(previousBlock.data.timestamp);
    const nextSlot = slots.getSlotNumber(nextBlock.data.timestamp);
    const isAfterPreviousSlot = previousSlot < nextSlot;

    return followsPrevious && isPlusOne && isAfterPreviousSlot;
};
