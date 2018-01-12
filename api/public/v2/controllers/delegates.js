const db = requireFrom('core/dbinterface').getInstance()
const responder = requireFrom('api/responder')
const Controller = require('./controller')

class DelegatesController extends Controller {
  index(req, res, next) {
    super.setState(req, res).then(() => {
      db.delegates.paginate(super.pager, {
        order: [[ 'publicKey', 'ASC' ]]
      }).then(delegates => {
        if (delegates.count) {
          super.respondWithPagination(delegates, 'delegate')
        } else {
          responder.resourceNotFound(res, 'No resources could not be found.');
        }
      })

      next()
    })
  }

  show(req, res, next) {
    super.setState(req, res).then(() => {
      db.delegates.findById(req.params.id).then(delegate => {
        if (delegate) {
          db.blocks.findLastByPublicKey(delegate.publicKey).then(lastBlock => {
            delegate.lastBlock = lastBlock

            super.respondWithResource(delegate, 'delegate')
          });
        } else {
          responder.resourceNotFound(res, 'Record could not be found.');
        }
      })

      next()
    })
  }

  blocks(req, res, next) {
    super.setState(req, res).then(() => {
      db.delegates.findById(req.params.id).then(delegate => {
        db.blocks.paginateByGenerator(delegate.publicKey, this.pager).then(blocks => {
          if (blocks.count) {
            super.respondWithPagination(blocks, 'block')
          } else {
            responder.resourceNotFound(res, 'No resources could not be found.');
          }
        })
      })

      next()
    })
  }

  voters(req, res, next) {
    super.setState(req, res).then(() => {
      res.send({
        data: '/api/delegates/:id/voters'
      })

      next()
    })
  }
}

module.exports = new DelegatesController()
