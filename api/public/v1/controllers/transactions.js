const db = requireFrom('core/dbinterface').getInstance()
const responder = requireFrom('api/responder')

class TransactionsController {
  index(req, res, next) {
    db.transactions.all({
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
    db.transactions.findById(req.params.id).then(result => {
      responder.ok(req, res, result)
    })

    next()
  }

  unconfirmed(req, res, next) {
    //needs to be picked up from transaction pool
    responder.notImplemented(res, 'Method has not yet been implemented.')

    next()
  }

  showUnconfirmed(req, res, next) {
    //needs to be picked up from transaction pool
    responder.notImplemented(res, 'Method has not yet been implemented.')

    next()
  }
}

module.exports = new TransactionsController()
