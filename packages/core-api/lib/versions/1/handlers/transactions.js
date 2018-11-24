const container = require('@arkecosystem/core-container')

const transactionPool = container.resolvePlugin('transactionPool')

const utils = require('../utils')
const schema = require('../schemas/transactions')
const { transactions: repository } = require('../../../repositories')

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
    return request.server.methods.v1.transactions.index(request)
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
    return request.server.methods.v1.transactions.show(request)
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
