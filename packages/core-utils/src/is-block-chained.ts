import { Crypto, Interfaces } from "@arkecosystem/crypto";

export function isBlockChained(previousBlock: Interfaces.IBlockData, nextBlock: Interfaces.IBlockData): boolean {
    const followsPrevious = nextBlock.previousBlock === previousBlock.id;
    const isPlusOne = nextBlock.height === previousBlock.height + 1;

    const previousSlot = Crypto.slots.getSlotNumber(previousBlock.timestamp);
    const nextSlot = Crypto.slots.getSlotNumber(nextBlock.timestamp);
    const isAfterPreviousSlot = previousSlot < nextSlot;

    return followsPrevious && isPlusOne && isAfterPreviousSlot;
}
