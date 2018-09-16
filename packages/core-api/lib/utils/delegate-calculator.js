'use strict'

const { Bignum } = require('@arkecosystem/crypto')
const container = require('@arkecosystem/core-container')
const blockchain = container.resolvePlugin('blockchain')
const config = container.resolvePlugin('config')

/**
 * Calculate the approval for the given delegate.
 * @param  {Delegate} delegate
 * @return {Number}
 */
exports.calculateApproval = (delegate) => {
  const lastBlock = blockchain.getLastBlock()
  const constants = config.getConstants(lastBlock.data.height)
  const rewards = new Bignum(constants.reward).times(lastBlock.data.height - constants.height)
  const totalSupply = new Bignum(config.genesisBlock.totalAmount).plus(rewards)

  return +delegate.voteBalance.times(100).dividedBy(totalSupply).toFixed(2)
}

/**
 * Calculate the productivity of the given delegate.
 * @param  {Delegate} delegate
 * @return {Number}
 */
exports.calculateProductivity = (delegate) => {
  const missedBlocks = parseInt(delegate.missedBlocks)
  const producedBlocks = parseInt(delegate.producedBlocks)

  if (!missedBlocks && !producedBlocks) {
    return 0
  }

  return +(100 - (missedBlocks / ((producedBlocks + missedBlocks) / 100))).toFixed(2)
}
