'use strict'
const { Bignum } = require('@arkecosystem/crypto')
const config = require('@arkecosystem/core-container').resolvePlugin('config')

/**
 * Calculate the approval for the given delegate.
 * @param  {Delegate} delegate
 * @param  {Number} height
 * @return {String} Approval, as a String with 2 decimals
 */
exports.calculateApproval = (delegate, height) => {
  const constants = config.getConstants(height)
  const totalSupply = new Bignum(config.genesisBlock.totalAmount).plus((height - constants.height) * constants.reward)

  return delegate.balance.times(100).dividedBy(totalSupply).toNumber().toFixed(2)
}

/**
 * Calculate the productivity of the given delegate.
 * @param  {Delegate} delegate
 * @return {String} Productivity, as a String with 2 decimals
 */
exports.calculateProductivity = delegate => {
  if (!delegate.missedBlocks && !delegate.producedBlocks) {
    return (0).toFixed(2)
  }

  return (100 - (delegate.missedBlocks / ((delegate.producedBlocks + delegate.missedBlocks) / 100))).toFixed(2)
}
