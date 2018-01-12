const db = requireFrom('core/dbinterface').getInstance()
const responder = requireFrom('api/responder')
const transformer = requireFrom('api/transformer')
const Paginator = requireFrom('api/paginator')
const Op = require('sequelize').Op

class WalletsController {
  index(req, res, next) {
    let page = parseInt(req.query.page || 1)
    let perPage = parseInt(req.query.perPage || 100)

    db.accounts.paginate({}, page, perPage).then(result => {
      const paginator = new Paginator(req, result.count, page, perPage)

      responder.ok(req, res, {
        data: new transformer(req).collection(result.rows, 'wallet'),
        links: paginator.links(),
        meta: Object.assign(paginator.meta(), {
          count: result.count
        }),
      })
    })

    next()
  }

  show(req, res, next) {
    db.accounts.findById(req.params.id).then(result => {
      if (result) {
        responder.ok(req, res, {
          data: new transformer(req).resource(result, 'wallet'),
        })
      } else {
        responder.resourceNotFound(res, 'Record could not be found.');
      }
    })

    next()
  }

  transactions(req, res, next) {
    db.accounts.findById(req.params.id).then(result => {
      const page = parseInt(req.query.page || 1)
      const perPage = parseInt(req.query.perPage || 100)

      db.transactions.paginate({
        where: {
          [Op.or]: [{
            senderPublicKey: result.publicKey,
          }, {
            recipientId: result.address,
          }]
        }
      }, page, perPage).then(result => {
        if (result.length) {
          const paginator = new Paginator(req, result.count, page, perPage)

          responder.ok(req, res, {
            data: new transformer(req).collection(result.rows, 'transaction'),
            links: paginator.links(),
            meta: Object.assign(paginator.meta(), {
              count: result.count
            }),
          })
        } else {
          responder.resourceNotFound(res, 'No resources could not be found.');
        }
      })
    })

    next()
  }

  transactionsSend(req, res, next) {
    db.accounts.findById(req.params.id).then(result => {
      const page = parseInt(req.query.page || 1)
      const perPage = parseInt(req.query.perPage || 100)

      db.transactions.paginate({
        where: {
          senderPublicKey: result.publicKey
        }
      }, page, perPage).then(result => {
        if (result.length) {
          const paginator = new Paginator(req, result.count, page, perPage)

          responder.ok(req, res, {
            data: new transformer(req).collection(result.rows, 'transaction'),
            links: paginator.links(),
            meta: Object.assign(paginator.meta(), {
              count: result.count
            }),
          })
        } else {
          responder.resourceNotFound(res, 'No resources could not be found.');
        }
      })
    })

    next()
  }

  transactionsReceived(req, res, next) {
    db.accounts.findById(req.params.id).then(result => {
      const page = parseInt(req.query.page || 1)
      const perPage = parseInt(req.query.perPage || 100)

      db.transactions.paginate({
        where: {
          recipientId: result.address
        }
      }, page, perPage).then(result => {
        if (result.length) {
          const paginator = new Paginator(req, result.count, page, perPage)

          responder.ok(req, res, {
            data: new transformer(req).collection(result.rows, 'transaction'),
            links: paginator.links(),
            meta: Object.assign(paginator.meta(), {
              count: result.count
            }),
          })
        } else {
          responder.resourceNotFound(res, 'No resources could not be found.');
        }
      })
    })

    next()
  }

  votes(req, res, next) {
      db.accounts.findById(req.params.id).then(result => {
      const page = parseInt(req.query.page || 1)
      const perPage = parseInt(req.query.perPage || 100)

      db.transactions.paginate({
        where: {
          senderPublicKey: result.publicKey,
          type: 3
        }
      }, page, perPage).then(result => {
        if (result.length) {
          const paginator = new Paginator(req, result.count, page, perPage)

          responder.ok(req, res, {
            data: new transformer(req).collection(result.rows, 'transaction'),
            links: paginator.links(),
            meta: Object.assign(paginator.meta(), {
              count: result.count
            }),
          })
        } else {
          responder.resourceNotFound(res, 'No resources could not be found.');
        }
      })
    })

    next()
  }
}

module.exports = new WalletsController()
