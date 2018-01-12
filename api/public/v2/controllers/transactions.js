const responder = requireFrom('api/responder')
const Controller = require('./controller')

class TransactionsController extends Controller {
  index(req, res, next) {
    super.setState(req, res, next).then(db => {
      db.transactions.paginate(this.pager).then(transactions => {
        super.respondWithPagination(transactions.count, transactions, 'transaction')
      })
    })
  }

  store(req, res, next) {
    responder.notImplemented(res, 'Method has not yet been implemented.')

    next()
  }

  show(req, res, next) {
    super.setState(req, res, next).then(db => {
      db.transactions.findById(req.params.id).then(transaction => {
        super.respondWithResource(transaction, transaction, 'transaction')
      })
    })
  }

  unconfirmed(req, res, next) {
    responder.notImplemented(res, 'Method has not yet been implemented.')

    next()
  }

  showUnconfirmed(req, res, next) {
    responder.notImplemented(res, 'Method has not yet been implemented.')

    next()
  }
}

module.exports = new TransactionsController()
