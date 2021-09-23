"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_utils_1 = require("@arkecosystem/core-utils");
const crypto_1 = require("@arkecosystem/crypto");
exports.transformDelegate = (delegate) => {
    const attributes = delegate.getAttribute("delegate");
    const data = {
        username: attributes.username,
        address: delegate.address,
        publicKey: delegate.publicKey,
        votes: crypto_1.Utils.BigNumber.make(attributes.voteBalance).toFixed(),
        rank: attributes.rank,
        isResigned: !!attributes.resigned,
        blocks: {
            produced: attributes.producedBlocks,
        },
        production: {
            approval: core_utils_1.delegateCalculator.calculateApproval(delegate),
        },
        forged: {
            fees: attributes.forgedFees.toFixed(),
            rewards: attributes.forgedRewards.toFixed(),
            total: core_utils_1.delegateCalculator.calculateForgedTotal(delegate),
        },
    };
    const lastBlock = attributes.lastBlock;
    if (lastBlock) {
        // @ts-ignore
        data.blocks.last = {
            id: lastBlock.id,
            height: lastBlock.height,
            timestamp: core_utils_1.formatTimestamp(lastBlock.timestamp),
        };
    }
    return data;
};
//# sourceMappingURL=transformer.js.map