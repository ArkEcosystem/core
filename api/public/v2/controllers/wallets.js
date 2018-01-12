const db = requireFrom('core/dbinterface').getInstance()
const responder = requireFrom('api/responder')
const transformer = requireFrom('api/transformer')
const Paginator = requireFrom('api/paginator')
const Op = require('sequelize').Op

class WalletsController {
  index(req, res, next) {
    let page = parseInt(req.query.page || 1)
    let perPage = parseInt(req.query.perPage || 100)

    db.accounts.paginate(page, perPage).then(wallets => {
      const paginator = new Paginator(req, wallets.count, page, perPage)

      responder.ok(req, res, {
        data: new transformer(req).collection(wallets.rows, 'wallet'),
        links: paginator.links(),
        meta: Object.assign(paginator.meta(), {
          count: wallets.count
        }),
      })
    })

    next()
  }

  show(req, res, next) {
    db.accounts.findById(req.params.id).then(wallet => {
      if (wallet) {
        responder.ok(req, res, {
          data: new transformer(req).resource(wallet, 'wallet'),
        })
      } else {
        responder.resourceNotFound(res, 'Record could not be found.');
      }
    })

    next()
  }

  transactions(req, res, next) {
    db.accounts.findById(req.params.id).then(wallet => {
      const page = parseInt(req.query.page || 1)
      const perPage = parseInt(req.query.perPage || 100)

      db.transactions.paginateAllByWallet(wallet, page, perPage).then(transactions => {
        if (transactions.count) {
          const paginator = new Paginator(req, transactions.count, page, perPage)

          responder.ok(req, res, {
            data: new transformer(req).collection(transactions.rows, 'transaction'),
            links: paginator.links(),
            meta: Object.assign(paginator.meta(), {
              count: transactions.count
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
    db.accounts.findById(req.params.id).then(wallet => {
      const page = parseInt(req.query.page || 1)
      const perPage = parseInt(req.query.perPage || 100)

      db.transactions.paginateAllBySender(wallet.publicKey, page, perPage).then(transactions => {
        if (transactions.count) {
          const paginator = new Paginator(req, transactions.count, page, perPage)

          responder.ok(req, res, {
            data: new transformer(req).collection(transactions.rows, 'transaction'),
            links: paginator.links(),
            meta: Object.assign(paginator.meta(), {
              count: transactions.count
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
    db.accounts.findById(req.params.id).then(wallet => {
      const page = parseInt(req.query.page || 1)
      const perPage = parseInt(req.query.perPage || 100)

      db.transactions.paginateAllByRecipient(wallet.address, page, perPage).then(transactions => {
        if (transactions.count) {
          const paginator = new Paginator(req, transactions.count, page, perPage)

          responder.ok(req, res, {
            data: new transformer(req).collection(transactions.rows, 'transaction'),
            links: paginator.links(),
            meta: Object.assign(paginator.meta(), {
              count: transactions.count
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
      db.accounts.findById(req.params.id).then(wallet => {
      const page = parseInt(req.query.page || 1)
      const perPage = parseInt(req.query.perPage || 100)

      db.transactions.paginateVotesBySender(wallet.publicKey, page, perPage).then(transactions => {
        if (transactions.count) {
          const paginator = new Paginator(req, transactions.count, page, perPage)

          responder.ok(req, res, {
            data: new transformer(req).collection(transactions.rows, 'transaction'),
            links: paginator.links(),
            meta: Object.assign(paginator.meta(), {
              count: transactions.count
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
