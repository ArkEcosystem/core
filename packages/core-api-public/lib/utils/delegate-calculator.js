'use strict'

const container = require('@arkecosystem/core-container')
const blockchain = container.get('blockchain')
const config = container.get('config')

/**
 * Calculate the approval for the given delegate.
 * @param  {Delegate} delegate
 * @return {Number}
 */
exports.calculateApproval = (delegate) => {
  const lastBlock = blockchain.getLastBlock(true)
  const constants = config.getConstants(lastBlock.height)
  const totalSupply = config.genesisBlock.totalAmount + (lastBlock.height - constants.height) * constants.reward

  return ((delegate.balance / totalSupply) * 100).toFixed(2)
}

/**
 * Calculate the productivity of the given delegate.
 * @param  {Delegate} delegate
 * @return {Number}
 */
exports.calculateProductivity = (delegate) => {
  if (!delegate.missedBlocks && !delegate.producedBlocks) {
    return (0).toFixed(2)
  }

  return (100 - (delegate.missedBlocks / ((delegate.producedBlocks + delegate.missedBlocks) / 100))).toFixed(2)
}
