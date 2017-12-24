const blockchain = require(__root + 'core/blockchainManager')
const config = require(__root + 'core/config')
const responseOk = require(__root + 'api/public/v1/responses/ok')
const transactions = require(__root + 'repositories/transactions')
const Paginator = require(__root + 'api/paginator')
const Transaction = require(__root + 'model/transaction')

class TransactionsController {
  index(req, res, next) {
    transactions.all({
      offset: parseInt(req.query.offset || 1),
      limit: parseInt(req.query.limit || 100)
    }).then(result => {
      responseOk.send(req, res, {
        transactions: result.rows
      })
    });

    next()
  }

  show(req, res, next) {
    transactions.findById(req.params.id).then(result => {
      responseOk.send(req, res, result)
    });

    next()
  }

  unconfirmed(req, res, next) {
    res.send({
      data: '/api/transactions/unconfirmed'
    })

    next()
  }

  showUnconfirmed(req, res, next) {
    res.send({
      data: '/api/transactions/unconfirmed/:id'
    })

    next()
  }
}

module.exports = new TransactionsController
