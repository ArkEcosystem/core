const db = require('core/dbinterface').getInstance()
const utils = require('../utils')

exports.index = {
  handler: (request, h) => {
    return db.transactions
      .findAllByType(3, utils.paginate(request))
      .then(transactions => h.response({
        results: utils.toCollection(request, transactions.rows, 'transaction'),
        totalCount: transactions.count
      }))
  }
}

exports.show = {
  handler: (request, h) => {
    return db.transactions
      .findByIdAndType(request.params.id, 3)
      .then(transaction => utils.respondWithResource(request, transaction, 'transaction'))
  }
}
