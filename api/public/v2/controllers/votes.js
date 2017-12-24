const blockchain = require(__root + 'core/blockchainManager')
const config = require(__root + 'core/config')
const responder = require(__root + 'api/responder')
const transactions = require(__root + 'repositories/transactions')
const Paginator = require(__root + 'api/paginator')

class VotesController {
  index(req, res, next) {
    let page = parseInt(req.query.page || 1)
    let perPage = parseInt(req.query.perPage || 100)

    transactions.paginate({
      where: {
        type: 3
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

    next()
  }

  store(req, res, next) {
    responder.notImplemented('Method has not yet been implemented.');

    next()
  }

  show(req, res, next) {
    transactions.findByIdAndType(req.params.id, 3).then(result => {
      res.send({
        data: result
      })
    })

    next()
  }
}

module.exports = new VotesController
