const db = requireFrom('core/dbinterface').getInstance()
const utils = require('../utils')

class BlocksController {
  index (req, res, next) {
    db.blocks
      .all(utils.paginator())
      .then(blocks => utils.respondWithPagination(blocks, 'block'))
  }

  show (req, res, next) {
    db.blocks
      .findById(req.params.id)
      .then(block => utils.respondWithResource(block, 'block'))
  }

  transactions (req, res, next) {
    db.blocks
      .findById(req.params.id)
      .then(block => db.transactions.paginateByBlock(block.id, utils.paginator()))
      .then(transactions => utils.respondWithPagination(transactions, 'transaction'))
  }

  search (req, res, next) {
    db.blocks
      .search(req.body)
      .then(blocks => utils.respondWithPagination(blocks, 'block'))
  }
}

module.exports = new BlocksController()
