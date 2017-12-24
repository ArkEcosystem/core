const blockchain = require(__root + 'core/blockchainManager')
const config = require(__root + 'core/config')
const responder = require(__root + 'api/responder')
const transactions = require(__root + 'repositories/transactions')
const Paginator = require(__root + 'api/paginator')

class TransactionsController {
  index(req, res, next) {
    let page = parseInt(req.query.page || 1)
    let perPage = parseInt(req.query.perPage || 100)

    transactions.paginate({}, page, perPage).then(result => {
      const paginator = new Paginator(req, result.count, page, perPage)

      responder.ok(req, res, {
        data: result.rows,
        links: paginator.links(),
        meta: Object.assign(paginator.meta(), {
          count: result.count
        })
      })
    })

    next()
  }

  search(req, res, next) {
    responder.notImplemented('Method has not yet been implemented.');

    next()
  }

  store(req, res, next) {
    responder.notImplemented('Method has not yet been implemented.');

    next()
  }

  show(req, res, next) {
    transactions.findById(req.params.id).then(result => {
      responder.ok(req, res, {
        data: result
      })
    })

    next()
  }

  unconfirmed(req, res, next) {
    responder.notImplemented('Method has not yet been implemented.');

    next()
  }

  showUnconfirmed(req, res, next) {
    responder.notImplemented('Method has not yet been implemented.');

    next()
  }

  fees(req, res, next) {
    res.send({
      data: config.getConstants(blockchain.getInstance().lastBlock.data.height).fees.send
    })

    next()
  }

  showFee(req, res, next) {
    res.send({
      data: config.getConstants(blockchain.getInstance().lastBlock.data.height).fees[req.params.type]
    })

    next()
  }
}

module.exports = new TransactionsController
