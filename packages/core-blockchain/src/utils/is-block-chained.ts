export const isBlockChained = (previousBlock: any, nextBlock: any): boolean => {
    const followsPrevious = nextBlock.data.previousBlock === previousBlock.data.id;
    const isFuture = nextBlock.data.timestamp > previousBlock.data.timestamp;
    const isPlusOne = nextBlock.data.height === previousBlock.data.height + 1;

    return followsPrevious && isFuture && isPlusOne;
};
