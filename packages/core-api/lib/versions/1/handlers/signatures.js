const container = require('@arkecosystem/core-container')

const config = container.resolvePlugin('config')
const blockchain = container.resolvePlugin('blockchain')

const utils = require('../utils')

/**
 * @type {Object}
 */
exports.fee = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler(request, h) {
    return utils.respondWith({
      fee: config.getConstants(blockchain.getLastBlock().data.height).fees
        .secondSignature,
    })
  },
}
