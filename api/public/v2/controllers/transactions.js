const db = requireFrom('core/dbinterface').getInstance()
const utils = require('../utils')

class TransactionsController {
  index (req, res, next) {
    db.transactions
      .findAll(utils.paginator())
      .then(transactions => utils.respondWithPagination(transactions, 'transaction'))
      .then(() => next())
  }

  store (req, res, next) {
    // think about if this will be implemented here or in a "transport" controller
    utils
      .respondWith('notImplemented', 'Method has not yet been implemented.')
      .then(() => next())
  }

  show (req, res, next) {
    db.transactions
      .findById(req.params.id)
      .then(transaction => utils.respondWithResource(transaction, 'transaction'))
      .then(() => next())
  }

  unconfirmed (req, res, next) {
    // needs to be picked up from transaction pool
    utils
      .respondWith('notImplemented', 'Method has not yet been implemented.')
      .then(() => next())
  }

  showUnconfirmed (req, res, next) {
    // needs to be picked up from transaction pool
    utils
      .respondWith('notImplemented', 'Method has not yet been implemented.')
      .then(() => next())
  }

  search (req, res, next) {
    db.transactions
      .search(req.body)
      .then(transactions => utils.respondWithPagination(transactions, 'transaction'))
      .then(() => next())
  }
}

module.exports = new TransactionsController()
