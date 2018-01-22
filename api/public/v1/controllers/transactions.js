const db = requireFrom('core/dbinterface').getInstance()
const helpers = require('../helpers')

class TransactionsController {
  index (req, res, next) {
    db.transactions
      .all(req.query)
      .then(result => helpers.toCollection(result.rows, 'transaction'))
      .then(transactions => helpers.respondWith('ok', {transactions}))
  }

  show (req, res, next) {
    db.transactions
      .findById(req.params.id)
      .then(result => helpers.respondWith('ok', result))
  }

  unconfirmed (req, res, next) {
    // needs to be picked up from transaction pool
    helpers.respondWith('notImplemented', 'Method has not yet been implemented.')
  }

  showUnconfirmed (req, res, next) {
    // needs to be picked up from transaction pool
    helpers.respondWith('notImplemented', 'Method has not yet been implemented.')
  }
}

module.exports = new TransactionsController()
