const { TRANSACTION_TYPES } = require('../../../../../../client/src/constants')
const db = require('../../../../../core/dbinterface').getInstance()
const utils = require('../utils')
const schema = require('../schema/votes')

exports.index = {
  handler: async (request, h) => {
    const transactions = await db.transactions.findAllByType(TRANSACTION_TYPES.VOTE, utils.paginate(request))

    return utils.toPagination(request, transactions, 'transaction')
  },
  options: {
    validate: schema.index
  }
}

exports.show = {
  handler: async (request, h) => {
    const transaction = await db.transactions.findByTypeAndId(TRANSACTION_TYPES.VOTE, request.params.id)

    return utils.respondWithResource(request, transaction, 'transaction')
  },
  options: {
    validate: schema.show
  }
}
