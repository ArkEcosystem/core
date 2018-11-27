const app = require('@arkecosystem/core-container')

const transactionPool = app.resolvePlugin('transactionPool')

const utils = require('../utils')
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
  async handler(request, h) {
    const data = await request.server.methods.v1.transactions.index(request)

    return utils.respondWithCache(data, h)
  },
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getTransactions,
      },
    },
  },
}

/**
 * @type {Object}
 */
exports.show = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler(request, h) {
    const data = await request.server.methods.v1.transactions.show(request)

    return utils.respondWithCache(data, h)
  },
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getTransaction,
      },
    },
  },
}

/**
 * @type {Object}
 */
exports.unconfirmed = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler(request, h) {
    const pagination = utils.paginate(request)

    let transactions = transactionPool.getTransactions(
      pagination.offset,
      pagination.limit,
    )
    transactions = transactions.map(transaction => ({
      serialized: transaction,
    }))

    return utils.respondWith({
      transactions: utils.toCollection(request, transactions, 'transaction'),
    })
  },
}

/**
 * @type {Object}
 */
exports.showUnconfirmed = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler(request, h) {
    const transaction = transactionPool.getTransaction(request.query.id)

    if (!transaction) {
      return utils.respondWith('Transaction not found', true)
    }

    return utils.respondWith({
      transaction: utils.toResource(
        request,
        {
          serialized: transaction.serialized,
        },
        'transaction',
      ),
    })
  },
}
