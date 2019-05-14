import { Crypto, Interfaces } from "@arkecosystem/crypto";

export const isBlockChained = (previousBlock: Interfaces.IBlockData, nextBlock: Interfaces.IBlockData): boolean => {
    const followsPrevious: boolean = nextBlock.previousBlock === previousBlock.id;
    const isPlusOne: boolean = nextBlock.height === previousBlock.height + 1;

    const previousSlot: number = Crypto.Slots.getSlotNumber(previousBlock.timestamp);
    const nextSlot: number = Crypto.Slots.getSlotNumber(nextBlock.timestamp);
    const isAfterPreviousSlot: boolean = previousSlot < nextSlot;

    return followsPrevious && isPlusOne && isAfterPreviousSlot;
};
