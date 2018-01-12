const db = requireFrom('core/dbinterface').getInstance()
const responder = requireFrom('api/responder')
const Controller = require('./controller')

class BlocksController extends Controller {
  index(req, res, next) {
    const pager = super.pager(req)

    db.blocks.paginate(pager).then(blocks => {
      if (blocks.count) {
        super.respondWithPagination(blocks, 'block', pager, req, res)
      } else {
        responder.resourceNotFound(res, 'No resources could not be found.');
      }
    })

    next()
  }

  show(req, res, next) {
    db.blocks.findById(req.params.id).then(block => {
      if (block) {
        super.respondWithResource(req, res, block, 'block')
      } else {
        responder.resourceNotFound(res, 'Record could not be found.');
      }
    });

    next()
  }

  transactions(req, res, next) {
    db.blocks.findById(req.params.id).then(block => {
      const pager = super.pager(req)

      db.transactions.paginateByBlock(block.id, pager).then(transactions => {
        if (transactions.count) {
          super.respondWithPagination(transactions, 'transaction', pager, req, res)
        } else {
          responder.resourceNotFound(res, 'No resources could not be found.');
        }
      })
    })

    next()
  }
}

module.exports = new BlocksController()
