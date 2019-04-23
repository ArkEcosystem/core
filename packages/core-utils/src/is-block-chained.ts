import { Crypto, Interfaces } from "@arkecosystem/crypto";

export function isBlockChained(previousBlock: Interfaces.IBlockData, nextBlock: Interfaces.IBlockData): boolean {
    const followsPrevious: boolean = nextBlock.previousBlock === previousBlock.id;
    const isPlusOne: boolean = nextBlock.height === previousBlock.height + 1;

    const previousSlot: number = Crypto.slots.getSlotNumber(previousBlock.timestamp);
    const nextSlot: number = Crypto.slots.getSlotNumber(nextBlock.timestamp);
    const isAfterPreviousSlot: boolean = previousSlot < nextSlot;

    return followsPrevious && isPlusOne && isAfterPreviousSlot;
}
