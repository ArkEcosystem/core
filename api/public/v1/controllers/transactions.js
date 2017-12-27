const blockchain = require(__root + 'core/blockchainManager')
const config = require(__root + 'core/config')
const responder = require(__root + 'api/responder')
const transactions = require(__root + 'repositories/transactions')
const Paginator = require(__root + 'api/paginator')
const Transaction = require(__root + 'model/transaction')

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
    responder.notImplemented(res, 'Method has not yet been implemented.');

    next()
  }

  showUnconfirmed(req, res, next) {
    responder.notImplemented(res, 'Method has not yet been implemented.');

    next()
  }
}

module.exports = new TransactionsController
