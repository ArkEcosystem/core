const db = requireFrom('core/dbinterface').getInstance()
const Controller = require('./controller')

class DelegatesController extends Controller {
  index(req, res, next) {
    super.setState(req, res).then(() => {
      db.delegates.paginate(this.pager, {
        order: [[ 'publicKey', 'ASC' ]]
      }).then(delegates => {
        super.respondWithPagination(delegates.count, delegates, 'delegate')
      })

      next()
    })
  }

  show(req, res, next) {
    super.setState(req, res).then(() => {
      db.delegates.findById(req.params.id).then(delegate => {
        db.blocks.findLastByPublicKey(delegate.publicKey).then(lastBlock => {
          delegate.lastBlock = lastBlock

          super.respondWithResource(delegate, delegate, 'delegate')
        });
      })

      next()
    })
  }

  blocks(req, res, next) {
    super.setState(req, res).then(() => {
      db.delegates.findById(req.params.id).then(delegate => {
        db.blocks.paginateByGenerator(delegate.publicKey, this.pager).then(blocks => {
          super.respondWithPagination(blocks.count, blocks, 'block')
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
