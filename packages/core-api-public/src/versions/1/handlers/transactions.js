const Boom = require('boom')
const config = require('@arkecosystem/core-pluggy').get('config')
const chainInstance = require('@arkecosystem/core-pluggy').get('blockchain')
const db = require('@arkecosystem/core-pluggy').get('database')
const utils = require('../utils')
const schema = require('../schemas/transactions')

exports.index = {
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getTransactions
      }
    }
  },
  handler: async (request, h) => {
    const transactions = await db.transactions.findAll({...request.query, ...utils.paginator(request)})

    if (!transactions) return utils.respondWith('No transactions found', true)

    return utils.respondWith({
      transactions: utils.toCollection(request, transactions.rows, 'transaction')
    })
  }
}

exports.show = {
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getTransaction
      }
    }
  },
  handler: async (request, h) => {
    const result = await db.transactions.findById(request.query.id)

    if (!result) return utils.respondWith('No transactions found', true)

    return utils.respondWith({ transaction: utils.toResource(request, result, 'transaction') })
  }
}

exports.unconfirmed = {
  handler: async (request, h) => {
    if (!config.server.transactionPool.enabled) {
      return Boom.teapot('Transaction Pool disabled...');
    }

    const pagination = utils.paginate(request)
    const transactions = await chainInstance.getTxHandler().getUnconfirmedTransactions(pagination.offset, pagination.limit)

    return utils.toPagination({
      count: transactions.length,
      rows: transactions
    }, transactions, 'transaction')
  }
}

exports.showUnconfirmed = {
  handler: async (request, h) => {
    if (!config.server.transactionPool.enabled) {
      return Boom.teapot('Transaction Pool disabled...');
    }

    const transaction = await chainInstance.getTxHandler().getUnconfirmedTransaction(request.param.id)

    return utils.respondWithResource(request, transaction, 'transaction')
  }
}
