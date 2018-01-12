const db = requireFrom('core/dbinterface').getInstance()
const responder = requireFrom('api/responder')
const transformer = requireFrom('api/transformer')
const Paginator = requireFrom('api/paginator')

class VotesController {
  index(req, res, next) {
    let page = parseInt(req.query.page || 1)
    let perPage = parseInt(req.query.perPage || 100)

    db.transactions.paginate({
      where: {
        type: 3
      }
    }, page, perPage).then(transactions => {
      const paginator = new Paginator(req, transactions.count, page, perPage)

      responder.ok(req, res, {
        data: new transformer(req).collection(transactions.rows, 'transaction'),
        links: paginator.links(),
        meta: Object.assign(paginator.meta(), {
          count: transactions.count
        }),
      })
    })

    next()
  }

  show(req, res, next) {
    db.transactions.findByIdAndType(req.params.id, 3).then(transactions => {
      if (transactions) {
        responder.ok(req, res, {
          data: transactions
        })
      } else {
        responder.resourceNotFound(res, 'Record could not be found.');
      }
    })

    next()
  }
}

module.exports = new VotesController()
