const responder = requireFrom('api/responder')
const Controller = require('./controller')

class TransactionsController extends Controller {
  index (req, res, next) {
    super.init(req, res, next).then(db => {
      db.transactionsCache.paginate(this.pager).then(transactions => {
        super.respondWithPagination(transactions, 'transaction')
      })
    })
  }

  store (req, res, next) {
    responder.notImplemented(res, 'Method has not yet been implemented.')

    next()
  }

  show (req, res, next) {
    super.init(req, res, next).then(db => {
      db.transactionsCache.findById(req.params.id).then(transaction => {
        super.respondWithResource(transaction, 'transaction')
      })
    })
  }

  unconfirmed (req, res, next) {
    responder.notImplemented(res, 'Method has not yet been implemented.')

    next()
  }

  showUnconfirmed (req, res, next) {
    responder.notImplemented(res, 'Method has not yet been implemented.')

    next()
  }
}

module.exports = new TransactionsController()
