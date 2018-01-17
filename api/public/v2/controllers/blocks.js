const db = requireFrom('core/dbinterface').getInstance()
const helpers = require('../helpers')

class BlocksController {
  index (req, res, next) {
    db.blocks.all(helpers.initPager()).then(blocks => {
      helpers.respondWithPagination(blocks, 'block')
    })
  }

  show (req, res, next) {
    db.blocks.findById(req.params.id).then(block => {
      helpers.respondWithResource(block, 'block')
    })
  }

  transactions (req, res, next) {
    db.blocks.findById(req.params.id).then(block => {
      db.blocks.paginateByBlock(block.id, helpers.initPager()).then(transactions => {
        helpers.respondWithPagination(transactions, 'transaction')
      })
    })
  }
}

module.exports = new BlocksController()
