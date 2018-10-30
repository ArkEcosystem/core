'use strict'

const container = require('@arkecosystem/core-container')
const { bignumify } = require('@arkecosystem/core-utils')
const config = container.resolvePlugin('config')
const blockchain = container.resolvePlugin('blockchain')

/**
 * @type {Object}
 */
exports.index = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler (request, h) {
    const lastBlock = blockchain.getLastBlock()

    const constants = config.getConstants(lastBlock.data.height)
    const rewards = bignumify(constants.reward).times(lastBlock.data.height - constants.height)

    return {
      data: {
        block: {
          height: lastBlock.data.height,
          id: lastBlock.data.id
        },
        supply: +bignumify(config.genesisBlock.totalAmount).plus(rewards).toFixed()
      }
    }
  }
}
