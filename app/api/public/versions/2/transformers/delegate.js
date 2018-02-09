const { calculateApproval, calculateProductivity } = require('app/utils/delegate-calculator')

module.exports = (delegate) => {
  const data = {
    username: delegate.username,
    address: delegate.address,
    publicKey: delegate.publicKey,
    votes: delegate.votebalance,
    rank: delegate.rank,
    blocks: {
      produced: delegate.producedBlocks,
      missed: delegate.missedBlocks
    },
    production: {
      approval: calculateApproval(delegate),
      productivity: calculateProductivity(delegate)
    }
  }

  if (delegate.lastBlock) {
    data.blocks.last = {
      id: delegate.lastBlock.id,
      timestamp: delegate.lastBlock.timestamp
    }
  }

  return data
}
