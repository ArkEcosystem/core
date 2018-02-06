const db = require('app/core/dbinterface').getInstance()
const { calculateApproval, calculateProductivity } = require('app/utils/delegate-calculator')

function getLastBlock (delegate) {
  return db.blocks
    .findLastByPublicKey(delegate.publicKey)
    .then(block => block)
}

module.exports = async (delegate) => {
  const data = {
    username: delegate.username,
    address: delegate.address,
    public_key: delegate.publicKey,
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

  const lastBlock = await getLastBlock(delegate)

  if (lastBlock) {
    data.blocks.last = {
      id: lastBlock.id,
      timestamp: lastBlock.timestamp
    }
  }

  return data
}
