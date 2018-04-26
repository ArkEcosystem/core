'use strict';

const config = require('@arkecosystem/core-plugin-manager').get('config')

/**
 * [description]
 * @param  {Delegate} delegate
 * @param  {Number} height
 * @return {Number}
 */
exports.calculateApproval = (delegate, height) => {
  const constants = config.getConstants(height)
  const totalSupply = config.genesisBlock.totalAmount + (height - constants.height) * constants.reward

  return ((delegate.balance / totalSupply) * 100).toFixed(2)
}

/**
 * [description]
 * @param  {Delegate} delegate
 * @return {Number}
 */
exports.calculateProductivity = (delegate) => {
  if (!delegate.missedBlocks && !delegate.producedBlocks) {
    return (0).toFixed(2)
  }

  return (100 - (delegate.missedBlocks / ((delegate.producedBlocks + delegate.missedBlocks) / 100))).toFixed(2)
}
