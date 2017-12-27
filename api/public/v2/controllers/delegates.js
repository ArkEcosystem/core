const blockchain = require(`${__root}/core/blockchainManager`)
const config = require(`${__root}/core/config`)
const responder = require(`${__root}/api/responder`)
const delegates = require(`${__root}/repositories/delegates`)
const blocks = require(`${__root}/repositories/blocks`)
const transactions = require(`${__root}/repositories/transactions`)
const Paginator = require(`${__root}/api/paginator`)
const Op = require('sequelize').Op

class DelegatesController {
  index(req, res, next) {
    let page = parseInt(req.query.page || 1)
    let perPage = parseInt(req.query.perPage || 100)

    delegates.paginate({
        order: [[ 'publicKey', 'ASC' ]]
    }, page, perPage).then(result => {
      const paginator = new Paginator(req, result.count, page, perPage)

      responder.ok(req, res, {
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
    responder.notImplemented(res, 'Method has not yet been implemented.');

    next()
  }

  show(req, res, next) {
    delegates.findById(req.params.id).then(result => {
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

  blocks(req, res, next) {
    delegates.findById(req.params.id).then(result => {
      const page = parseInt(req.query.page || 1)
      const perPage = parseInt(req.query.perPage || 100)

      blocks.paginate({
        where: {
          generatorPublicKey: result.publicKey
        }
      }, page, perPage).then(result => {
        const paginator = new Paginator(req, result.count, page, perPage)

        responder.ok(req, res, {
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

  transactions(req, res, next) {
    delegates.findById(req.params.id).then(result => {
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

        responder.ok(req, res, {
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
    delegates.findById(req.params.id).then(result => {
      const page = parseInt(req.query.page || 1)
      const perPage = parseInt(req.query.perPage || 100)

      transactions.paginate({
        where: {
          senderPublicKey: result.publicKey
        }
      }, page, perPage).then(result => {
        const paginator = new Paginator(req, result.count, page, perPage)

        responder.ok(req, res, {
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
    delegates.findById(req.params.id).then(result => {
      const page = parseInt(req.query.page || 1)
      const perPage = parseInt(req.query.perPage || 100)

      transactions.paginate({
        where: {
          recipientId: result.address
        }
      }, page, perPage).then(result => {
        const paginator = new Paginator(req, result.count, page, perPage)

        responder.ok(req, res, {
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

  voters(req, res, next) {
    res.send({
      data: '/api/delegates/:id/voters'
    })

    next()
  }
}

module.exports = new DelegatesController
