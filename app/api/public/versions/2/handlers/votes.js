const db = require('app/core/dbinterface').getInstance()
const utils = require('../utils')

exports.index = {
  handler: async (request, h) => {
    return db.transactions
      .findAllByType(3, utils.paginate(request))
      .then(transactions => utils.toPagination(request, transactions, 'transaction'))
  }
}

exports.show = {
  handler: async (request, h) => {
    return db.transactions
      .findByIdAndType(request.params.id, 3)
      .then(transaction => utils.respondWithResource(request, transaction, 'transaction'))
  }
}
