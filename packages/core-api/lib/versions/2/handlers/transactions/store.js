'use strict'

const { TransactionGuard } = require('@arkecosystem/core-transaction-pool')
const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const transactionPool = container.resolvePlugin('transactionPool')

const schema = require('../../schema/transactions')
const memory = require('./memory')

/**
 * @type {Object}
 */
module.exports = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    if (!transactionPool) {
      return {
        data: []
      }
    }

    const { valid, invalid } = memory.memorize(request.payload.transactions)

    const guard = new TransactionGuard(transactionPool)
    guard.invalid = invalid
    await guard.validate(valid)

    if (guard.hasAny('accept')) {
      logger.info(`Received ${guard.accept.length} new transactions`)

      await transactionPool.addTransactions(guard.accept)

      memory
        .forget(guard.getIds('accept'))
        .forget(guard.getIds('excess'))
    }

    if (!request.payload.isBroadCasted && guard.hasAny('broadcast')) {
      await container
        .resolvePlugin('p2p')
        .broadcastTransactions(guard.broadcast)
    }

    return {
      data: {
        accept: guard.getIds('accept'),
        excess: guard.getIds('excess'),
        invalid: guard.getIds('invalid')
      }
    }
  },
  options: {
    validate: schema.store,
    plugins: {
      pagination: {
        enabled: false
      }
    }
  }
}
