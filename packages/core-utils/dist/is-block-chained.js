"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
exports.isBlockChained = (previousBlock, nextBlock, logger) => {
    const followsPrevious = nextBlock.previousBlock === previousBlock.id;
    const isPlusOne = nextBlock.height === previousBlock.height + 1;
    const previousSlot = crypto_1.Crypto.Slots.getSlotNumber(previousBlock.timestamp);
    const nextSlot = crypto_1.Crypto.Slots.getSlotNumber(nextBlock.timestamp);
    const isAfterPreviousSlot = previousSlot < nextSlot;
    const isChained = followsPrevious && isPlusOne && isAfterPreviousSlot;
    if (logger && !isChained) {
        const messagePrefix = `Block { height: ${nextBlock.height}, id: ${nextBlock.id}, ` +
            `previousBlock: ${nextBlock.previousBlock} } is not chained to the ` +
            `previous block { height: ${previousBlock.height}, id: ${previousBlock.id} }`;
        let messageDetail;
        if (!followsPrevious) {
            messageDetail = `previous block id mismatch`;
        }
        else if (!isPlusOne) {
            messageDetail = `height is not plus one`;
        }
        else if (!isAfterPreviousSlot) {
            messageDetail = `previous slot is not smaller: ` +
                `${previousSlot} (derived from timestamp ${previousBlock.timestamp}) VS ` +
                `${nextSlot} (derived from timestamp ${nextBlock.timestamp})`;
        }
        logger.warn(`${messagePrefix}: ${messageDetail}`);
    }
    return isChained;
};
//# sourceMappingURL=is-block-chained.js.map