const Controller = require('./controller')

class BlocksController extends Controller {
  index (req, res, next) {
    super.init(req, res, next).then(db => {
      db.blocks.all(this.pager).then(blocks => {
        super.respondWithPagination(blocks, 'block')
      })
    })
  }

  show (req, res, next) {
    super.init(req, res, next).then(db => {
      db.blocks.findById(req.params.id).then(block => {
        super.respondWithResource(block, 'block')
      })
    })
  }

  transactions (req, res, next) {
    super.init(req, res, next).then(db => {
      db.blocks.findById(req.params.id).then(block => {
        db.blocks.paginateByBlock(block.id, this.pager).then(transactions => {
          super.respondWithPagination(transactions, 'transaction')
        })
      })
    })
  }
}

module.exports = new BlocksController()
