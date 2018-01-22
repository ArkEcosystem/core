const db = requireFrom('core/dbinterface').getInstance()
const helpers = require('../helpers')

class BlocksController {
  index (req, res, next) {
    db.blocks
      .all(helpers.getPaginator())
      .then(blocks => helpers.respondWithPagination(blocks, 'block'))
  }

  show (req, res, next) {
    db.blocks
      .findById(req.params.id)
      .then(block => helpers.respondWithResource(block, 'block'))
  }

  transactions (req, res, next) {
    db.blocks.findById(req.params.id).then(block => {
      db.blocks
        .paginateByBlock(block.id, helpers.getPaginator())
        .then(transactions => helpers.respondWithPagination(transactions, 'transaction'))
    })
  }
}

module.exports = new BlocksController()
