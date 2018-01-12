const db = requireFrom('core/dbinterface').getInstance()
const responder = requireFrom('api/responder')
const transformer = requireFrom('api/transformer')
const Paginator = requireFrom('api/paginator')

class TransactionsController {
  index(req, res, next) {
    let page = parseInt(req.query.page || 1)
    let perPage = parseInt(req.query.perPage || 100)

    db.transactions.paginate({}, page, perPage).then(transactions => {
      const paginator = new Paginator(req, transactions.count, page, perPage)

      responder.ok(req, res, {
        data: new transformer(req).collection(transactions.rows, 'transaction'),
        links: paginator.links(),
        meta: Object.assign(paginator.meta(), {
          count: transactions.count
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
    db.transactions.findById(req.params.id).then(transaction => {
      if (transaction) {
        responder.ok(req, res, {
          data: new transformer(req).collection(transaction, 'transaction'),
        })
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
