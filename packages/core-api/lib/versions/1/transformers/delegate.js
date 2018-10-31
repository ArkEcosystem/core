'use strict'

const { delegateCalculator } = require('@arkecosystem/core-utils')

/**
 * Turns a "delegate" object into a generic object.
 * @param  {Object} delegate
 * @return {Object}
 */
module.exports = (delegate) => {
  return {
    username: delegate.username,
    address: delegate.address,
    publicKey: delegate.publicKey,
    vote: delegate.voteBalance + '',
    producedblocks: delegate.producedBlocks,
    missedblocks: delegate.missedBlocks,
    forged: delegate.forged,
    rate: delegate.rate,
    approval: delegateCalculator.calculateApproval(delegate),
    productivity: delegateCalculator.calculateProductivity(delegate)
  }
}
