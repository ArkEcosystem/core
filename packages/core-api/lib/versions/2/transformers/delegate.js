'use strict'

const { calculateApproval, calculateProductivity } = require('../../../utils/delegate-calculator')
const formatTimestamp = require('./utils/format-timestamp')

/**
 * Turns a "delegate" object into a generic object.
 * @param  {Object} delegate
 * @return {Object}
 */
module.exports = (delegate) => {
  const data = {
    username: delegate.username,
    address: delegate.address,
    publicKey: delegate.publicKey,
    votes: +delegate.voteBalance.toString(),
    rank: delegate.rate || 0, // forcing to 0 if undefined  as it is not yet reliable
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
