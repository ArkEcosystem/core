const db = requireFrom('core/dbinterface').getInstance()
const responder = requireFrom('api/responder')
const Controller = require('./controller')

class DelegatesController extends Controller {
  index(req, res, next) {
    const pager = super.pager(req)

    db.delegates.paginate(pager, {
      order: [[ 'publicKey', 'ASC' ]]
    }).then(delegates => {
      if (delegates.count) {
        super.respondWithPagination(delegates, 'delegate', pager, req, res)
      } else {
        responder.resourceNotFound(res, 'No resources could not be found.');
      }
    })

    next()
  }

  show(req, res, next) {
    db.delegates.findById(req.params.id).then(delegate => {
      if (delegate) {
        db.blocks.findLastByPublicKey(delegate.publicKey).then(lastBlock => {
          delegate.lastBlock = lastBlock

          super.respondWithResource(req, res, delegate, 'delegate')
        });
      } else {
        responder.resourceNotFound(res, 'Record could not be found.');
      }
    })

    next()
  }

  blocks(req, res, next) {
    db.delegates.findById(req.params.id).then(delegate => {
      const pager = super.pager(req)

      db.blocks.paginateByGenerator(delegate.publicKey, pager).then(blocks => {
        if (blocks.count) {
          super.respondWithPagination(blocks, 'block', pager, req, res)
        } else {
          responder.resourceNotFound(res, 'No resources could not be found.');
        }
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
