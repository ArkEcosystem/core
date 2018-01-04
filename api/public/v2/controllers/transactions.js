const db = requireFrom('core/dbinterface').getInstance()
const blockchain = requireFrom('core/blockchainManager')
const config = requireFrom('core/config')
const responder = requireFrom('api/responder')
const Paginator = requireFrom('api/paginator')

class TransactionsController {
  index(req, res, next) {
    let page = parseInt(req.query.page || 1)
    let perPage = parseInt(req.query.perPage || 100)

    db.transactions.paginate({}, page, perPage).then(result => {
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
    responder.notImplemented(res, 'Method has not yet been implemented.')

    next()
  }

  store(req, res, next) {
    responder.notImplemented(res, 'Method has not yet been implemented.')

    next()
  }

  show(req, res, next) {
    db.transactions.findById(req.params.id).then(result => {
      if (result) {
        responder.ok(req, res, {
          data: result
        })
      } else {
        responder.resourceNotFound(res, 'Sorry no DB entry could be found!');
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

  fees(req, res, next) {
    responder.ok({
      data: config.getConstants(blockchain.getInstance().lastBlock.data.height).fees.send
    })

    next()
  }

  showFee(req, res, next) {
    responder.ok({
      data: config.getConstants(blockchain.getInstance().lastBlock.data.height).fees[req.params.type]
    })

    next()
  }
}

module.exports = new TransactionsController()
