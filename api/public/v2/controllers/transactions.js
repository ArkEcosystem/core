const db = requireFrom('core/dbinterface').getInstance()
const responder = requireFrom('api/responder')
const Controller = require('./controller')

class TransactionsController extends Controller {
  index(req, res, next) {
    const pager = super.pager(req)

    db.transactions.paginate(pager).then(transactions => {
      if (transactions.count) {
        super.respondWithPagination(transactions, 'transaction', pager, req, res)
      } else {
        responder.resourceNotFound(res, 'No resources could not be found.');
      }
    })

    next()
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
    db.transactions.findById(req.params.id).then(transaction => {
      if (transaction) {
        super.respondWithResource(req, res, transaction, 'transaction')
      } else {
        responder.resourceNotFound(res, 'Record could not be found.');
      }
    })

    next()
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
