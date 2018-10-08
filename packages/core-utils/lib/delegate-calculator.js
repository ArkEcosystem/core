'use strict'

const { Bignum } = require('@arkecosystem/crypto')
const container = require('@arkecosystem/core-container')

/**
 * Calculate the approval for the given delegate.
 * @param  {Delegate} delegate
 * @param  {Number} height
 * @return {String} Approval, as a String with 2 decimals
 */
exports.calculateApproval = (delegate, height) => {
  const config = container.resolvePlugin('config')

  if (!height) {
    height = container.resolvePlugin('blockchain').getLastBlock().data.height
  }

  const constants = config.getConstants(height)
  const totalSupply = new Bignum(config.genesisBlock.totalAmount).plus((height - constants.height) * constants.reward)

  return +delegate.voteBalance.times(100).dividedBy(totalSupply).toNumber().toFixed(2)
}

/**
 * Calculate the productivity of the given delegate.
 * @param  {Delegate} delegate
 * @return {String} Productivity, as a String with 2 decimals
 */
exports.calculateProductivity = delegate => {
  const missedBlocks = +delegate.missedBlocks
  const producedBlocks = +delegate.producedBlocks

  if (!missedBlocks && !producedBlocks) {
    return +(0).toFixed(2)
  }

  return +(100 - (missedBlocks / ((producedBlocks + missedBlocks) / 100))).toFixed(2)
}
