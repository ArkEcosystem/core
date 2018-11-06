'use strict'

const { bignumify, formatTimestamp, delegateCalculator } = require('@arkecosystem/core-utils')

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
    votes: +bignumify(delegate.voteBalance).toFixed(),
    rank: delegate.rate,
    blocks: {
      produced: delegate.producedBlocks,
      missed: delegate.missedBlocks
    },
    production: {
      approval: delegateCalculator.calculateApproval(delegate),
      productivity: delegateCalculator.calculateProductivity(delegate)
    },
    forged: {
      fees: +delegate.forgedFees.toFixed(),
      rewards: +delegate.forgedRewards.toFixed(),
      total: +(delegate.forgedFees.plus(delegate.forgedRewards)).toFixed()
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
