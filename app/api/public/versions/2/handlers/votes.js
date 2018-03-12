const db = require('app/core/dbinterface').getInstance()
const utils = require('../utils')

exports.index = {
  options: {
    cache: {
      expiresIn: 60 * 1000 * 5
    }
  },
  handler: async (request, h) => {
    const transactions = await db.transactions.findAllByType(3, utils.paginate(request))

    return utils.toPagination(request, transactions, 'transaction')
  }
}

exports.show = {
  handler: async (request, h) => {
    const transaction = await db.transactions.findByIdAndType(request.params.id, 3)

    return utils.respondWithResource(request, transaction, 'transaction')
  }
}
