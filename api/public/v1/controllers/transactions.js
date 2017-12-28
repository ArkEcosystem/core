const blockchain = requireFrom('core/blockchainManager')
const config = requireFrom('core/config')
const responder = requireFrom('api/responder')
const transactions = requireFrom('repositories/transactions')
const Paginator = requireFrom('api/paginator')
const Transaction = requireFrom('model/transaction')

class TransactionsController {
  index(req, res, next) {
    transactions.all({
      offset: parseInt(req.query.offset || 1),
      limit: parseInt(req.query.limit || 100)
    }).then(result => {
      responder.ok(req, res, {
        transactions: result.rows
      })
    })

    next()
  }

  show(req, res, next) {
    transactions.findById(req.params.id).then(result => {
      responseOk.send(req, res, result)
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

module.exports = new TransactionsController
