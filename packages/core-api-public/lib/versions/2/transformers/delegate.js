'use strict';

// TODO: make this accessible through a module
const { calculateApproval, calculateProductivity } = require('../../../utils/delegate-calculator')
const formatTimestamp = require('./utils/format-timestamp')

/**
 * [description]
 * @param  {[type]} delegate [description]
 * @return {[type]}          [description]
 */
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

  const lastBlock = delegate.lastBlock

  if (lastBlock) {
    data.blocks.last = {
      id: lastBlock.id,
      timestamp: formatTimestamp(lastBlock.timestamp)
    }
  }

  return data
}
