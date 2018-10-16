'use strict'

const container = require('@arkecosystem/core-container')

/**
 * Calculate the round and nextRound based on the height and active delegates.
 * @param  {Number} height
 * @return {Object}
 */
exports.calculateRound = (height) => {
  const config = container.resolvePlugin('config')
  const maxDelegates = config.getConstants(height).activeDelegates

  const round = Math.floor((height - 1) / maxDelegates) + 1
  const nextRound = Math.floor((height) / maxDelegates) + 1

  return { round, nextRound, maxDelegates }
}

/**
 * Detect if height is the beginning of a new round.
 * @param  {Number} height
 * @return {boolean} true if new round, false if not
 */
exports.isNewRound = (height) => {
  const config = container.resolvePlugin('config')
  const maxDelegates = config.getConstants(height).activeDelegates

  return height % maxDelegates === 1
}
