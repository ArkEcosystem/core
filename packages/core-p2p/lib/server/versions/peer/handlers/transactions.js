const Boom = require('boom')
const pluralize = require('pluralize')

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
  handler(request, h) {
    return {
      data: [],
    }
  },
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
  async handler(request, h) {
    const guard = new TransactionGuard(transactionPool)

    const result = await guard.validate(request.payload.transactions)

    if (result.invalid.length > 0) {
      return Boom.notAcceptable(
        'Transactions list could not be accepted.',
        guard.errors,
      )
    }

    if (result.broadcast.length > 0) {
      container.resolvePlugin('p2p').broadcastTransactions(result.broadcast)
    }

    return { data: result.accept.map(t => t.id) }
  },
  config: {
    cors: {
      additionalHeaders: ['nethash', 'port', 'version'],
    },
    validate: schema.store,
  },
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
  async handler(request, h) {
    const transactionIds = request.payload.transactions
      .slice(0, 100)
      .filter(id => id.match('[0-9a-fA-F]{32}'))
    const rows = await container
      .resolvePlugin('database')
      .getTransactionsFromIds(transactionIds)

    // TODO: v1 compatibility patch. Add transformer and refactor later on
    const transactions = rows.map(row => {
      const transaction = Transaction.deserialize(
        row.serialized.toString('hex'),
      )
      transaction.blockId = row.block_id
      transaction.senderId = crypto.getAddress(transaction.senderPublicKey)
      return transaction
    })

    transactionIds.forEach((transaction, i) => {
      transactionIds[i] = transactions.find(tx2 => tx2.id === transactionIds[i])
    })

    return { data: transactionIds }
  },
  options: {
    validate: schema.search,
  },
}
