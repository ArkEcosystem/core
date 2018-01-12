const db = requireFrom('core/dbinterface').getInstance()
const responder = requireFrom('api/responder')
const Controller = require('./controller')

class BlocksController extends Controller {
  index(req, res, next) {
    super.setState(req, res).then(() => {
      db.blocks.paginate(this.pager).then(blocks => {
        if (blocks.count) {
          super.respondWithPagination(blocks, 'block')
        } else {
          responder.resourceNotFound(res, 'No resources could not be found.');
        }
      })

      next()
    })
  }

  show(req, res, next) {
    super.setState(req, res).then(() => {
      db.blocks.findById(req.params.id).then(block => {
        if (block) {
          super.respondWithResource(block, 'block')
        } else {
          responder.resourceNotFound(res, 'Record could not be found.');
        }
      });

      next()
    })
  }

  transactions(req, res, next) {
    super.setState(req, res).then(() => {
      db.blocks.findById(req.params.id).then(block => {
        db.transactions.paginateByBlock(block.id, this.pager).then(transactions => {
          if (transactions.count) {
            super.respondWithPagination(transactions, 'transaction')
          } else {
            responder.resourceNotFound(res, 'No resources could not be found.');
          }
        })
      })

      next()
    })
  }
}

module.exports = new BlocksController()
