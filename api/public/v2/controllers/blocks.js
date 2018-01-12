const db = requireFrom('core/dbinterface').getInstance()
const responder = requireFrom('api/responder')
const transformer = requireFrom('api/transformer')
const Paginator = requireFrom('api/paginator')

class BlocksController {
  index(req, res, next) {
    let page = parseInt(req.query.page || 1)
    let perPage = parseInt(req.query.perPage || 100)

    db.blocks.paginate(page, perPage).then(blocks => {
      const paginator = new Paginator(req, blocks.count, page, perPage)

      responder.ok(req, res, {
        data: new transformer(req).collection(blocks.rows, 'block'),
        links: paginator.links(),
        meta: Object.assign(paginator.meta(), {
          count: blocks.count
        }),
      })
    })

    next()
  }

  show(req, res, next) {
    db.blocks.findById(req.params.id).then(block => {
      if (block) {
        responder.ok(req, res, {
          data: block
        })
      } else {
        responder.resourceNotFound(res, 'Record could not be found.');
      }
    });

    next()
  }

  transactions(req, res, next) {
    db.blocks.findById(req.params.id).then(block => {
      const page = parseInt(req.query.page || 1)
      const perPage = parseInt(req.query.perPage || 100)

      db.transactions.paginateByBlock(block.id, page, perPage).then(transactions => {
        const paginator = new Paginator(req, transactions.count, page, perPage)

        responder.ok(req, res, {
          data: new transformer(req).collection(transactions.rows, 'transaction'),
          links: paginator.links(),
          meta: Object.assign(paginator.meta(), {
            count: transactions.count
          }),
        })
      })
    })

    next()
  }
}

module.exports = new BlocksController()
