'use strict'

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
  const totalSupply = config.genesisBlock.totalAmount + (lastBlock.data.height - constants.height) * constants.reward

  return +((delegate.voteBalance / totalSupply) * 100).toFixed(2)
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
