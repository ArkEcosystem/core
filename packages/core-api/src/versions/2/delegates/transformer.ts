import { bignumify, delegateCalculator, formatTimestamp } from "@arkecosystem/core-utils";

export function transformDelegate(delegate) {
    const data = {
        username: delegate.username,
        address: delegate.address,
        publicKey: delegate.publicKey,
        votes: +bignumify(delegate.voteBalance).toFixed(),
        rank: delegate.rate,
        blocks: {
            produced: delegate.producedBlocks,
        },
        production: {
            approval: delegateCalculator.calculateApproval(delegate),
        },
        forged: {
            fees: +delegate.forgedFees.toFixed(),
            rewards: +delegate.forgedRewards.toFixed(),
            total: delegateCalculator.calculateForgedTotal(delegate),
        },
    };

    const lastBlock = delegate.lastBlock;

    if (lastBlock) {
        // @ts-ignore
        data.blocks.last = {
            id: lastBlock.id,
            height: lastBlock.height,
            timestamp: formatTimestamp(lastBlock.timestamp),
        };
    }

    return data;
}
