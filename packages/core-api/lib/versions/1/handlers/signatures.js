const app = require('@arkecosystem/core-container')

const config = app.resolvePlugin('config')
const blockchain = app.resolvePlugin('blockchain')

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
        .staticFees.secondSignature,
    })
  },
}
