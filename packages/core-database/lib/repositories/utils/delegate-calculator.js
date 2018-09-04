'use strict'

const config = require('@arkecosystem/core-container').resolvePlugin('config')
const { Bignum } = require('@arkecosystem/crypto')

/**
 * Calculate the approval for the given delegate.
 * @param  {Delegate} delegate
 * @param  {Number} height
 * @return {String} Approval, as a String with 2 decimals
 */
exports.calculateApproval = (delegate, height) => {
  const constants = config.getConstants(height)
  const rewardSupply = Bignum.from((height - constants.height) * constants.reward)
  const totalSupply = Bignum.from(config.genesisBlock.totalAmount).add(rewardSupply)

  return delegate.balance.multiply(Bignum.from(100)).divide(totalSupply).toNumber().toFixed(2)
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
