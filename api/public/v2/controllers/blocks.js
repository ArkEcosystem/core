const db = requireFrom('core/dbinterface').getInstance()
const utils = require('../utils')

class BlocksController {
  index (req, res, next) {
    db.blocks
      .findAll(utils.paginator())
      .then(blocks => utils.respondWithPagination(blocks, 'block'))
      .then(() => next())
  }

  show (req, res, next) {
    db.blocks
      .findById(req.params.id)
      .then(block => utils.respondWithResource(block, 'block'))
      .then(() => next())
  }

  transactions (req, res, next) {
    db.blocks
      .findById(req.params.id)
      .then(block => db.transactions.findAllByBlock(block.id, utils.paginator()))
      .then(transactions => utils.respondWithPagination(transactions, 'transaction'))
      .then(() => next())
  }

  search (req, res, next) {
    db.blocks
      .search(req.body)
      .then(blocks => utils.respondWithPagination(blocks, 'block'))
      .then(() => next())
  }
}

module.exports = new BlocksController()
