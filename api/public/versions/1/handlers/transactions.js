const Boom = require('boom')
const db = requireFrom('core/dbinterface').getInstance()
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
  handler: (request, h) => {
    return db.transactions
      .findAll({...request.query, ...utils.paginator(request)})
      .then(result => {
        if (!result) return utils.respondWith('No transactions found', true)

        return utils.respondWith({
          transactions: utils.toCollection(request, result.rows, 'transaction')
        })
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
  handler: (request, h) => {
    return db.transactions
      .findById(request.query.id)
      .then(result => {
        if (!result) return utils.respondWith('No transactions found', true)

        return utils.respondWith({
          transaction: utils.toResource(request, result, 'transaction')
        })
      })
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
