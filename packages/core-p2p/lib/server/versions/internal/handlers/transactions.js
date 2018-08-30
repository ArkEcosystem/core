'use strict'

const container = require('@arkecosystem/core-container')
const config = container.resolvePlugin('config')

const { Transaction } = require('@arkecosystem/crypto').models

/**
 * @type {Object}
 */
exports.postVerifyTransaction = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    const transaction = new Transaction(Transaction.deserialize(request.payload.transaction))
    const result = await container.resolvePlugin('database').verifyTransaction(transaction)

    return { success: result }
  }
}

/**
 * @type {Object}
 */
exports.getTransactionsForForging = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    const blockchain = container.resolvePlugin('blockchain')

    const height = blockchain.getLastBlock().data.height
    const blockSize = config.getConstants(height).block.maxTransactions

    try {
      return {
        success: true,
        data: await blockchain.getUnconfirmedTransactions(blockSize, true)
      }
    } catch (error) {
      return h.response({
        success: false,
        message: error.message
      }).code(500).takeover()
    }
  }
}
