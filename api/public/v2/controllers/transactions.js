const db = requireFrom('core/dbinterface').getInstance()
const helpers = require('../helpers')

class TransactionsController {
  index (req, res, next) {
    db.transactions.paginate(helpers.getPaginator()).then(transactions => {
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

  search(req, res, next) {
    db.transactions.search(req.body).then(transactions => {
      helpers.respondWithPagination(transactions, 'transaction')
    })
  }
}

module.exports = new TransactionsController()
