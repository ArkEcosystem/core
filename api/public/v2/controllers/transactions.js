const Controller = require('./controller')

class TransactionsController extends Controller {
  index (req, res, next) {
    super.init(req, res, next).then(db => {
      db.transactions.paginate(this.pager).then(transactions => {
        super.respondWithPagination(transactions, 'transaction')
      })
    })
  }

  store (req, res, next) {
    super.init(req, res, next).then(() => {
      super.respondWith('notImplemented', 'Method has not yet been implemented.')
    })
  }

  show (req, res, next) {
    super.init(req, res, next).then(db => {
      db.transactions.findById(req.params.id).then(transaction => {
        super.respondWithResource(transaction, 'transaction')
      })
    })
  }

  unconfirmed (req, res, next) {
    super.init(req, res, next).then(() => {
      super.respondWith('notImplemented', 'Method has not yet been implemented.')
    })
  }

  showUnconfirmed (req, res, next) {
    super.init(req, res, next).then(() => {
      super.respondWith('notImplemented', 'Method has not yet been implemented.')
    })
  }
}

module.exports = new TransactionsController()
