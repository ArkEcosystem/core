const db = requireFrom('core/dbinterface').getInstance()
const Controller = require('./controller')

class BlocksController extends Controller {
  index(req, res, next) {
    super.setState(req, res).then(() => {
      db.blocks.paginate(this.pager).then(blocks => {
        super.respondWithPagination(blocks.count, blocks, 'block')
      })

      next()
    })
  }

  show(req, res, next) {
    super.setState(req, res).then(() => {
      db.blocks.findById(req.params.id).then(block => {
        super.respondWithResource(block, block, 'block')
      });

      next()
    })
  }

  transactions(req, res, next) {
    super.setState(req, res).then(() => {
      db.blocks.findById(req.params.id).then(block => {
        db.transactions.paginateByBlock(block.id, this.pager).then(transactions => {
          super.respondWithPagination(transactions.count, transactions, 'transaction')
        })
      })

      next()
    })
  }
}

module.exports = new BlocksController()
