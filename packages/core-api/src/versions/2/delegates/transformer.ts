import {
  bignumify,
  delegateCalculator,
  formatTimestamp,
} from "@arkecosystem/core-utils";

export default function(delegate) {
  const data = {
    username: delegate.username,
    address: delegate.address,
    publicKey: delegate.publicKey,
    votes: +bignumify(delegate.voteBalance).toFixed(),
    rank: delegate.rate,
    blocks: {
      produced: delegate.producedBlocks,
      missed: delegate.missedBlocks,
    },
    production: {
      approval: delegateCalculator.calculateApproval(delegate),
      productivity: delegateCalculator.calculateProductivity(delegate),
    },
    forged: {
      fees: +delegate.forgedFees.toFixed(),
      rewards: +delegate.forgedRewards.toFixed(),
      total: +delegate.forgedFees.plus(delegate.forgedRewards).toFixed(),
    },
  };

  const lastBlock = delegate.lastBlock;

  if (lastBlock) {
    // @ts-ignore
    data.blocks.last = {
      id: lastBlock.id,
      timestamp: formatTimestamp(lastBlock.timestamp),
    };
  }

  return data;
}
