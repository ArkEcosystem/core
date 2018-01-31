const db = requireFrom('core/dbinterface').getInstance()
const utils = require('../utils')

const index = (req, res, next) => {
  db.transactions
    .findAll(utils.paginator(req))
    .then(transactions => utils.respondWithPagination(req, res, transactions, 'transaction'))
    .then(() => next())
}

const store = (req, res, next) => {
  // think about if this will be implemented here or in a "transport" controller
  utils
    .respondWith(req, res, 'notImplemented', 'Method has not yet been implemented.')
    .then(() => next())
}

const show = (req, res, next) => {
  db.transactions
    .findById(req.params.id)
    .then(transaction => utils.respondWithResource(req, res, transaction, 'transaction'))
    .then(() => next())
}

const unconfirmed = (req, res, next) => {
  // needs to be picked up from transaction pool
  utils
    .respondWith(req, res, 'notImplemented', 'Method has not yet been implemented.')
    .then(() => next())
}

const showUnconfirmed = (req, res, next) => {
  // needs to be picked up from transaction pool
  utils
    .respondWith(req, res, 'notImplemented', 'Method has not yet been implemented.')
    .then(() => next())
}

const search = (req, res, next) => {
  db.transactions
    .search(req.body)
    .then(transactions => utils.respondWithPagination(req, res, transactions, 'transaction'))
    .then(() => next())
}

module.exports = {
  index,
  store,
  show,
  unconfirmed,
  showUnconfirmed,
  search,
}
