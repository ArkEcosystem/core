const Boom = require('boom')
const db = require('app/core/dbinterface').getInstance()
const utils = require('../utils')

exports.index = {
  handler: async (request, h) => {
    const transactions = await db.transactions.findAll(utils.paginate(request))

    return utils.toPagination(request, transactions, 'transaction')
  }
}

exports.store = {
  handler: async (request, h) => {
    // think about if this will be implemented here or in a "transport" controller
    return Boom.notImplemented()
  }
}

exports.show = {
  handler: async (request, h) => {
    const transaction = await db.transactions.findById(request.params.id)

    return utils.respondWithResource(request, transaction, 'transaction')
  }
}

exports.unconfirmed = {
  handler: async (request, h) => {
    // needs to be picked up from transaction pool
    return Boom.notImplemented()
  }
}

exports.showUnconfirmed = {
  handler: async (request, h) => {
    // needs to be picked up from transaction pool
    return Boom.notImplemented()
  }
}

exports.search = {
  handler: async (request, h) => {
    const transactions = await db.transactions.search(request.query)

    return utils.toPagination(request, transactions, 'transaction')
  }
}
