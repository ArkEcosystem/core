const db = requireFrom('core/dbinterface').getInstance()
const responder = requireFrom('api/responder')
const transformer = requireFrom('api/transformer')
const Paginator = requireFrom('api/paginator')
const Op = require('sequelize').Op

class DelegatesController {
  index(req, res, next) {
    let page = parseInt(req.query.page || 1)
    let perPage = parseInt(req.query.perPage || 100)

    db.delegates.paginate(page, perPage, {
      order: [[ 'publicKey', 'ASC' ]]
    }).then(result => {
      const paginator = new Paginator(req, result.count, page, perPage)

      responder.ok(req, res, {
        data: new transformer(req).collection(result.rows, 'delegate'),
        links: paginator.links(),
        meta: Object.assign(paginator.meta(), {
          count: result.count
        }),
      })
    })

    next()
  }

  show(req, res, next) {
    db.delegates.findById(req.params.id).then(delegate => {
      if (delegate) {
        db.blocks.findLastByPublicKey(delegate.publicKey).then(lastBlock => {
          delegate.lastBlock = lastBlock

          responder.ok(req, res, {
            data: new transformer(req).resource(delegate, 'delegate')
          })
        });
      } else {
        responder.resourceNotFound(res, 'Record could not be found.');
      }
    })

    next()
  }

  blocks(req, res, next) {
    db.delegates.findById(req.params.id).then(delegate => {
      const page = parseInt(req.query.page || 1)
      const perPage = parseInt(req.query.perPage || 100)

      db.blocks.paginateByGenerator(delegate.publicKey, page, perPage).then(blocks => {
        const paginator = new Paginator(req, blocks.count, page, perPage)

        responder.ok(req, res, {
          data: new transformer(req).collection(blocks.rows, 'block'),
          links: paginator.links(),
          meta: Object.assign(paginator.meta(), {
            count: blocks.count
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

module.exports = new DelegatesController()
