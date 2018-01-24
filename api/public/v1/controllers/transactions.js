const db = requireFrom('core/dbinterface').getInstance()
const helpers = require('../helpers')

class TransactionsController {
  index (req, res, next) {
    db.transactions
      .all(req.query)
      .then(result => {
        if (!result) return helpers.respondWith('error', 'No transactions found')

        return helpers.respondWith('ok', {
          transactions: helpers.toCollection(result.rows, 'transaction')
        })
      })
  }

  show (req, res, next) {
    db.transactions
      .findById(req.query.id)
      .then(result => {
        if (!result) return helpers.respondWith('error', 'No transactions found')

        return helpers.respondWith('ok', {
          transaction: helpers.toResource(result, 'transaction')
        })
      })
  }

  unconfirmed (req, res, next) {
    // needs to be picked up from transaction pool
    helpers.respondWith('error', 'Method has not yet been implemented.')
  }

  showUnconfirmed (req, res, next) {
    // needs to be picked up from transaction pool
    helpers.respondWith('error', 'Method has not yet been implemented.')
  }
}

module.exports = new TransactionsController()
