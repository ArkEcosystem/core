const db = requireFrom('core/dbinterface').getInstance()
const responder = requireFrom('api/responder')
const Paginator = requireFrom('api/paginator')

class VotesController {
  index(req, res, next) {
    let page = parseInt(req.query.page || 1)
    let perPage = parseInt(req.query.perPage || 100)

    db.transactions.paginate({
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

  show(req, res, next) {
    db.transactions.findByIdAndType(req.params.id, 3).then(result => {
      if (result) {
        responder.ok(req, res, {
          data: result
        })
      } else {
        responder.resourceNotFound(res, 'Record could not be found.');
      }
    })

    next()
  }
}

module.exports = new VotesController()
