const db = requireFrom('core/dbinterface').getInstance()
const helpers = require('../helpers')

class TransactionsController {
  index (req, res, next) {
    db.transactions.paginate(helpers.initPager()).then(transactions => {
      helpers.respondWithPagination(transactions, 'transaction')
    })
  }

  store (req, res, next) {
    helpers.respondWith('notImplemented', 'Method has not yet been implemented.')
  }

  show (req, res, next) {
    db.transactions.findById(req.params.id).then(transaction => {
      helpers.respondWithResource(transaction, 'transaction')
    })
  }

  unconfirmed (req, res, next) {
    helpers.respondWith('notImplemented', 'Method has not yet been implemented.')
  }

  showUnconfirmed (req, res, next) {
    helpers.respondWith('notImplemented', 'Method has not yet been implemented.')
  }
}

module.exports = new TransactionsController()
