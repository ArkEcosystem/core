const db = requireFrom('core/dbinterface').getInstance()
const responder = requireFrom('api/responder')
const Controller = require('./controller')

class TransactionsController extends Controller {
  index(req, res, next) {
    super.setState(req, res).then(() => {
      db.transactions.paginate(this.pager).then(transactions => {
        super.respondWithPagination(transactions.count, transactions, 'transaction')
      })

      next()
    })
  }

  search(req, res, next) {
    responder.notImplemented(res, 'Method has not yet been implemented.')

    next()
  }

  store(req, res, next) {
    responder.notImplemented(res, 'Method has not yet been implemented.')

    next()
  }

  show(req, res, next) {
    super.setState(req, res).then(() => {
      db.transactions.findById(req.params.id).then(transaction => {
        super.respondWithResource(transaction, transaction, 'transaction')
      })

      next()
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
