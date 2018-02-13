const Boom = require('boom')
const db = require('app/core/dbinterface').getInstance()
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
  handler: (request, h) => {
    // needs to be picked up from transaction pool
    return Boom.notImplemented()
  }
}

exports.showUnconfirmed = {
  handler: (request, h) => {
    // needs to be picked up from transaction pool
    return Boom.notImplemented()
  }
}
