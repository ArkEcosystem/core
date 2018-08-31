'use strict'

const container = require('@arkecosystem/core-container')
const config = container.resolvePlugin('config')

const { Transaction } = require('@arkecosystem/crypto').models

const schema = require('../schemas/transactions')

/**
 * @type {Object}
 */
exports.verify = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    const transaction = new Transaction(Transaction.deserialize(request.payload.transaction))

    return {
      data: {
        valid: await container.resolvePlugin('database').verifyTransaction(transaction)
      }
    }
  },
  options: {
    validate: schema.verify
  }
}

/**
 * @type {Object}
 */
exports.forging = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    const blockchain = container.resolvePlugin('blockchain')

    const height = blockchain.getLastBlock().data.height
    const maxTransactions = config.getConstants(height).block.maxTransactions

    return {
      data: await blockchain.getUnconfirmedTransactions(maxTransactions, true)
    }
  }
}
