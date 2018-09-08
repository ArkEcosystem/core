'use strict'

const { calculateApproval, calculateProductivity } = require('../../../utils/delegate-calculator')

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
    approval: calculateApproval(delegate),
    productivity: calculateProductivity(delegate)
  }
}
