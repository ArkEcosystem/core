const arkjs = require('arkjs')
const blockchain = require(__root + 'core/blockchainManager')
const config = require(__root + 'core/config')
const logger = require(__root + 'core/logger')
const responseOk = require(__root + 'api/public/v2/responses/ok')
const responseIntervalServerError = require(__root + 'api/public/v2/responses/exceptions/internal-server-error')
const responseUnprocessableEntity = require(__root + 'api/public/v2/responses/exceptions/unprocessable-entity')
const accounts = require(__root + 'repositories/accounts')
const transactions = require(__root + 'repositories/transactions')
const Paginator = require(__root + 'api/paginator')
const Op = require('sequelize').Op

class WalletsController {
  index(req, res, next) {
    let page = parseInt(req.query.page || 1)
    let perPage = parseInt(req.query.perPage || 100)

    accounts.paginate({}, page, perPage).then(result => {
      const paginator = new Paginator(req, result.count, page, perPage)

      responseOk.send(req, res, {
        data: result.rows,
        links: paginator.links(),
        meta: Object.assign(paginator.meta(), {
          count: result.count
        }),
      })
    })

    next()
  }

  search(req, res, next) {
    res.send({
      data: '/api/wallets/search'
    })

    next()
  }

  show(req, res, next) {
    accounts.findById(req.params.id).then(result => {
      res.send({
        data: result
      })
    })

    next()
  }

  transactions(req, res, next) {
    accounts.findById(req.params.id).then(result => {
      const page = parseInt(req.query.page || 1)
      const perPage = parseInt(req.query.perPage || 100)

      transactions.paginate({
        where: {
          [Op.or]: [{
            senderPublicKey: result.publicKey,
          }, {
            recipientId: result.address,
          }]
        }
      }, page, perPage).then(result => {
        const paginator = new Paginator(req, result.count, page, perPage)

        responseOk.send(req, res, {
          data: result.rows,
          links: paginator.links(),
          meta: Object.assign(paginator.meta(), {
            count: result.count
          }),
        })
      })
    })

    next()
  }

  transactionsSend(req, res, next) {
    accounts.findById(req.params.id).then(result => {
      const page = parseInt(req.query.page || 1)
      const perPage = parseInt(req.query.perPage || 100)

      transactions.paginate({
        where: {
          senderPublicKey: result.publicKey
        }
      }, page, perPage).then(result => {
        const paginator = new Paginator(req, result.count, page, perPage)

        responseOk.send(req, res, {
          data: result.rows,
          links: paginator.links(),
          meta: Object.assign(paginator.meta(), {
            count: result.count
          }),
        })
      })
    })

    next()
  }

  transactionsReceived(req, res, next) {
    accounts.findById(req.params.id).then(result => {
      const page = parseInt(req.query.page || 1)
      const perPage = parseInt(req.query.perPage || 100)

      transactions.paginate({
        where: {
          recipientId: result.address
        }
      }, page, perPage).then(result => {
        const paginator = new Paginator(req, result.count, page, perPage)

        responseOk.send(req, res, {
          data: result.rows,
          links: paginator.links(),
          meta: Object.assign(paginator.meta(), {
            count: result.count
          }),
        })
      })
    })

    next()
  }

  votes(req, res, next) {
    accounts.findById(req.params.id).then(result => {
      const page = parseInt(req.query.page || 1)
      const perPage = parseInt(req.query.perPage || 100)

      transactions.paginate({
        where: {
          senderPublicKey: result.publicKey,
          type: 3
        }
      }, page, perPage).then(result => {
        const paginator = new Paginator(req, result.count, page, perPage)

        responseOk.send(req, res, {
          data: result.rows,
          links: paginator.links(),
          meta: Object.assign(paginator.meta(), {
            count: result.count
          }),
        })
      })
    })

    next()
  }
}

module.exports = new WalletsController
