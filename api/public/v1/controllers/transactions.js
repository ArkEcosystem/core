const db = requireFrom('core/dbinterface').getInstance()
const responder = requireFrom('api/responder')
const transformer = requireFrom('api/transformer')

class TransactionsController {
  index(req, res, next) {
    db.transactions.all(req.query).then(result => {
      responder.ok(req, res, {
        transactions: new transformer(req).collection(result.rows, 'transaction')
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
