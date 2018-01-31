const db = requireFrom('core/dbinterface').getInstance()
const utils = require('../utils')

const index = (req, res, next) => {
  db.transactions
    .findAllByType(3, utils.paginator(req))
    .then(transactions => utils.respondWithPagination(req, res, transactions, 'transaction'))
    .then(() => next())
}

const show = (req, res, next) => {
  db.transactions
    .findByIdAndType(req.params.id, 3)
    .then(transaction => utils.respondWithResource(req, res, transaction, 'transaction'))
    .then(() => next())
}

module.exports = {
  index,
  show,
}
