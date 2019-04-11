import { Crypto, Interfaces } from "@arkecosystem/crypto";

export const isBlockChained = (previousBlock: Interfaces.IBlock, nextBlock: Interfaces.IBlock): boolean => {
    const followsPrevious = nextBlock.data.previousBlock === previousBlock.data.id;
    const isPlusOne = nextBlock.data.height === previousBlock.data.height + 1;

    const previousSlot = Crypto.slots.getSlotNumber(previousBlock.data.timestamp);
    const nextSlot = Crypto.slots.getSlotNumber(nextBlock.data.timestamp);
    const isAfterPreviousSlot = previousSlot < nextSlot;

    return followsPrevious && isPlusOne && isAfterPreviousSlot;
};
