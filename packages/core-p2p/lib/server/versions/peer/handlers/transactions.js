'use strict'

const Boom = require('boom')
const container = require('@arkecosystem/core-container')
const { TransactionGuard } = require('@arkecosystem/core-transaction-pool')
const { crypto } = require('@arkecosystem/crypto')
const { Transaction } = require('@arkecosystem/crypto').models

const transactionPool = container.resolvePlugin('transactionPool')
const logger = container.resolvePlugin('logger')

const schema = require('../schemas/transactions')

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
    return {
      data: []
    }
  }
}

/**
 * @type {Object}
 */
exports.store = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    /**
     * Here we will make sure we memorize the transactions for future requests
     * and decide which transactions are valid or invalid in order to prevent
     * duplication and race conditions caused by concurrent requests.
     */
    const { valid, invalid } = transactionPool.memory.memorize(request.payload.transactions)

    const guard = new TransactionGuard(transactionPool)
    guard.invalidate(invalid, 'Already memorized.')

    await guard.validate(valid)

    if (guard.hasAny('invalid')) {
      return Boom.notAcceptable('Transactions list could not be accepted.', guard.errors)
    }

    // TODO: Review throttling of v1
    if (guard.hasAny('accept')) {
      logger.info(`Accepted ${guard.accept.length} transactions from ${request.payload.transactions.length} received`)

      logger.verbose(`Accepted transactions: ${guard.accept.map(tx => tx.id)}`)

      await transactionPool.addTransactions([...guard.accept, ...guard.excess])

      transactionPool.memory
        .forget(guard.getIds('accept'))
        .forget(guard.getIds('excess'))
    }

    if (!request.payload.isBroadCasted && guard.hasAny('broadcast')) {
      await container
        .resolvePlugin('p2p')
        .broadcastTransactions(guard.broadcast)
    }

    return {
      data: guard.getIds('accept')
    }
  },
  config: {
    cors: {
      additionalHeaders: ['nethash', 'port', 'version']
    },
    validate: schema.store
  }
}

/**
 * @type {Object}
 */
exports.search = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    const transactionIds = request.payload.transactions.slice(0, 100).filter(id => id.match('[0-9a-fA-F]{32}'))
    const rows = await container.resolvePlugin('database').getTransactionsFromIds(transactionIds)

    // TODO: v1 compatibility patch. Add transformer and refactor later on
    const transactions = rows.map(row => {
      let transaction = Transaction.deserialize(row.serialized.toString('hex'))
      transaction.blockId = row.block_id
      transaction.senderId = crypto.getAddress(transaction.senderPublicKey)
      return transaction
    })

    const data = transactionIds.map((transaction, i) => (transactionIds[i] = transactions.find(tx2 => tx2.id === transactionIds[i])))

    return { data }
  },
  options: {
    validate: schema.search
  }
}
