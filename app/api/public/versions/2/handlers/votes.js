const { TRANSACTION_TYPES } = require('app/core/constants')
const db = require('app/core/dbinterface').getInstance()
const utils = require('../utils')

exports.index = {
  handler: async (request, h) => {
    const transactions = await db.transactions.findAllByType(TRANSACTION_TYPES.VOTE, utils.paginate(request))

    return utils.toPagination(request, transactions, 'transaction')
  }
}

exports.show = {
  handler: async (request, h) => {
    const transaction = await db.transactions.findByTypeAndId(TRANSACTION_TYPES.VOTE, request.params.id)

    return utils.respondWithResource(request, transaction, 'transaction')
  }
}
