const db = requireFrom('core/dbinterface').getInstance()
const utils = require('../utils')

const index = (req, res, next) => {
  db.blocks
    .findAll(utils.paginator(req))
    .then(blocks => utils.respondWithPagination(req, res, blocks, 'block'))
    .then(() => next())
}

const show = (req, res, next) => {
  db.blocks
    .findById(req.params.id)
    .then(block => utils.respondWithResource(req, res, block, 'block'))
    .then(() => next())
}

const transactions = (req, res, next) => {
  db.blocks
    .findById(req.params.id)
    .then(block => db.transactions.findAllByBlock(block.id, utils.paginator(req)))
    .then(transactions => utils.respondWithPagination(req, res, transactions, 'transaction'))
    .then(() => next())
}

const search = (req, res, next) => {
  db.blocks
    .search(req.body)
    .then(blocks => utils.respondWithPagination(req, res, blocks, 'block'))
    .then(() => next())
}

module.exports = {
  index,
  show,
  transactions,
  search
}
