const db = requireFrom('core/dbinterface').getInstance()
const utils = require('../utils')

const index = (req, res, next) => {
  db.transactions
    .findAll({...req.query, ...utils.paginator(req)})
    .then(result => {
      if (!result) return utils.respondWith(req, res, 'error', 'No transactions found')

      return utils.respondWith(req, res, 'ok', {
        transactions: utils.toCollection(req, result.rows, 'transaction')
      })
    })
    .then(() => next())
}

const show = (req, res, next) => {
  db.transactions
    .findById(req.query.id)
    .then(result => {
      if (!result) return utils.respondWith(req, res, 'error', 'No transactions found')

      return utils.respondWith(req, res, 'ok', {
        transaction: utils.toResource(req, result, 'transaction')
      })
    })
    .then(() => next())
}

const unconfirmed = (req, res, next) => {
  // needs to be picked up from transaction pool
  utils
    .respondWith(req, res, 'error', 'Method has not yet been implemented.')
    .then(() => next())
}

const showUnconfirmed = (req, res, next) => {
  // needs to be picked up from transaction pool
  utils
    .respondWith(req, res, 'error', 'Method has not yet been implemented.')
    .then(() => next())
}

module.exports = {
  index,
  show,
  unconfirmed,
  showUnconfirmed,
}
