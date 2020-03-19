import { Crypto, Interfaces } from "@arkecosystem/crypto";

type BlockChainedDetails = {
    followsPrevious: boolean;
    isPlusOne: boolean;
    previousSlot: number;
    nextSlot: number;
    isAfterPreviousSlot: boolean;
    isChained: boolean;
};

const getBlockChainedDetails = (
    previousBlock: Interfaces.IBlockData,
    nextBlock: Interfaces.IBlockData,
): BlockChainedDetails => {
    const followsPrevious: boolean = nextBlock.previousBlock === previousBlock.id;
    const isPlusOne: boolean = nextBlock.height === previousBlock.height + 1;

    const previousSlot: number = Crypto.Slots.getSlotNumber(previousBlock.timestamp);
    const nextSlot: number = Crypto.Slots.getSlotNumber(nextBlock.timestamp);
    const isAfterPreviousSlot: boolean = previousSlot < nextSlot;

    const isChained: boolean = followsPrevious && isPlusOne && isAfterPreviousSlot;

    return { followsPrevious, isPlusOne, previousSlot, nextSlot, isAfterPreviousSlot, isChained };
};

export const isBlockChained = (previousBlock: Interfaces.IBlockData, nextBlock: Interfaces.IBlockData): boolean => {
    const details: BlockChainedDetails = getBlockChainedDetails(previousBlock, nextBlock);
    return details.isChained;
};

export const getBlockNotChainedErrorMessage = (
    previousBlock: Interfaces.IBlockData,
    nextBlock: Interfaces.IBlockData,
): string => {
    const details: BlockChainedDetails = getBlockChainedDetails(previousBlock, nextBlock);

    if (details.isChained) {
        throw new Error("Block had no chain error");
    }

    const messagePrefix: string =
        `Block { height: ${nextBlock.height}, id: ${nextBlock.id}, ` +
        `previousBlock: ${nextBlock.previousBlock} } is not chained to the ` +
        `previous block { height: ${previousBlock.height}, id: ${previousBlock.id} }`;

    let messageDetail: string | undefined;

    if (!details.followsPrevious) {
        messageDetail = `previous block id mismatch`;
    } else if (!details.isPlusOne) {
        messageDetail = `height is not plus one`;
    } else if (!details.isAfterPreviousSlot) {
        messageDetail =
            `previous slot is not smaller: ` +
            `${details.previousSlot} (derived from timestamp ${previousBlock.timestamp}) VS ` +
            `${details.nextSlot} (derived from timestamp ${nextBlock.timestamp})`;
    }

    return `${messagePrefix}: ${messageDetail}`;
};
