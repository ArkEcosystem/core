const db = requireFrom('core/dbinterface').getInstance()
const responder = requireFrom('api/responder')
const Paginator = requireFrom('api/paginator')

class BlocksController {
  index(req, res, next) {
    let page = parseInt(req.query.page || 1)
    let perPage = parseInt(req.query.perPage || 100)

    db.blocks.paginate({}, page, perPage).then(result => {
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
    db.blocks.findById(req.params.id).then(result => {
      if (result) {
        responder.ok(req, res, {
          data: result
        })
      } else {
        responder.resourceNotFound(res, 'Record could not be found.');
      }
    });

    next()
  }

  transactions(req, res, next) {
    db.blocks.findById(req.params.id).then(result => {
      const page = parseInt(req.query.page || 1)
      const perPage = parseInt(req.query.perPage || 100)

      db.transactions.paginate({
        where: {
          blockId: result.id
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
}

module.exports = new BlocksController()
