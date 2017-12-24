const blockchain = require(__root + 'core/blockchainManager')
const config = require(__root + 'core/config')
const responseOk = require(__root + 'api/public/v1/responses/ok')

class TransactionsController {
  index(req, res, next) {
    res.send({
      data: '/api/transactions'
    })

    next()
  }

  show(req, res, next) {
    res.send({
      data: '/api/transactions/:id'
    })

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
