const db = requireFrom('core/dbinterface').getInstance()
const helpers = require('../helpers')

class VotesController {
  index (req, res, next) {
    db.transactions
      .paginateByType(3, helpers.getPaginator())
      .then(transactions => helpers.respondWithPagination(transactions, 'transaction'))
  }

  show (req, res, next) {
    db.transactions
      .findByIdAndType(req.params.id, 3)
      .then(transaction => helpers.respondWithResource(transaction, 'transaction'))
  }
}

module.exports = new VotesController()
