'use strict'

const { formatTimestamp, delegateCalculator } = require('@arkecosystem/core-utils')

/**
 * Turns a "delegate" object into a generic object.
 * @param  {Object} delegate
 * @return {Object}
 */
module.exports = delegate => {
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
      approval: delegateCalculator.calculateApproval(delegate),
      productivity: delegateCalculator.calculateProductivity(delegate)
    },
    forged: {
      fees: delegate.forgedFees.toNumber(),
      rewards: delegate.forgedRewards.toNumber(),
      total: delegate.forgedFees.plus(delegate.forgedRewards).toNumber()
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
