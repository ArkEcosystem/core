const app = require('@arkecosystem/core-container')
const { bignumify, supplyCalculator } = require('@arkecosystem/core-utils')

const config = app.resolvePlugin('config')
const blockchain = app.resolvePlugin('blockchain')

/**
 * @type {Object}
 */
exports.index = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler(request, h) {
    const lastBlock = blockchain.getLastBlock()

    return {
      data: {
        block: {
          height: lastBlock.data.height,
          id: lastBlock.data.id,
        },
        supply: supplyCalculator.calculate(lastBlock.data.height),
      },
    }
  },
}
