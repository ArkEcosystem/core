const db = requireFrom('core/dbinterface').getInstance()
const responder = requireFrom('api/responder')
const transformer = requireFrom('api/transformer')

class TransactionsController {
  index(req, res, next) {

    let whereStatement = {}
    const filter = ['type', 'senderPublicKey', 'vendorField', 'senderId', 'recipientId', 'amount', 'fee']
    for (const elem of filter) {
      if (!!req.query[elem])
        whereStatement[elem] = req.query[elem]
    }

    /*if (req.query.ownerAddress && req.query.ownerPublicKey) {
      whereStatement['senderPublicKey'] = req.query.ownerPublicKey
      whereStatement['$or':
      owner = '("senderPublicKey"::bytea = ${ownerPublicKey} OR "recipientId" = ${ownerAddress})';
      params.ownerPublicKey = filter.ownerPublicKey;
      params.ownerAddress = filter.ownerAddress;
    }*/


    /*if (req.query.orderBy) {
      let order[] = req.query.orderBy.split(':')
      if (['id', 'senderPublicKey', 'recipientId', 'vendorFieldHex'].includes(order[0])) {
        retPeers = order[1].toUpperCase() === 'ASC' ? retPeers.sort((a, b) => a[order[0]] - b[order[0]]) : retPeers.sort((a, b) => a[order[0]] + b[order[0]])
      }
    }*/

    db.transactions.all({
      where: whereStatement,
      offset: parseInt(req.query.offset || 1),
      limit: parseInt(req.query.limit || 100)
    }).then(result => {
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
