const db = requireFrom('core/dbinterface').getInstance()
const utils = require('../utils')

class VotesController {
  index (req, res, next) {
    db.transactions
      .findAllByType(3, utils.paginator())
      .then(transactions => utils.respondWithPagination(transactions, 'transaction'))
      .then(() => next())
  }

  show (req, res, next) {
    db.transactions
      .findByIdAndType(req.params.id, 3)
      .then(transaction => utils.respondWithResource(transaction, 'transaction'))
      .then(() => next())
  }
}

module.exports = new VotesController()
