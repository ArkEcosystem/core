const db = requireFrom('core/dbinterface').getInstance()
const utils = require('../utils')

class TransactionsController {
  index (req, res, next) {
    db.transactions
      .paginate(utils.paginator())
      .then(transactions => utils.respondWithPagination(transactions, 'transaction'))
  }

  store (req, res, next) {
    // think about if this will be implemented here or in a "transport" controller
    utils.respondWith('notImplemented', 'Method has not yet been implemented.')
  }

  show (req, res, next) {
    db.transactions
      .findById(req.params.id)
      .then(transaction => utils.respondWithResource(transaction, 'transaction'))
  }

  unconfirmed (req, res, next) {
    // needs to be picked up from transaction pool
    utils.respondWith('notImplemented', 'Method has not yet been implemented.')
  }

  showUnconfirmed (req, res, next) {
    // needs to be picked up from transaction pool
    utils.respondWith('notImplemented', 'Method has not yet been implemented.')
  }

  search (req, res, next) {
    db.transactions
      .search(req.body)
      .then(transactions => utils.respondWithPagination(transactions, 'transaction'))
  }
}

module.exports = new TransactionsController()
