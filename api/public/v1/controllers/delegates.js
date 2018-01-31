const blockchain = requireFrom('core/blockchainManager').getInstance()
const config = requireFrom('core/config')
const db = requireFrom('core/dbinterface').getInstance()
const utils = require('../utils')

const index = (req, res, next) => {
  db.delegates
    .findAll()
    .then(delegates => utils.respondWith(req, res, 'ok', {delegates}))
    .then(() => next())
}

const show = (req, res, next) => {
  utils
    .respondWith(req, res, 'error', 'Method has not yet been implemented.')
    .then(() => next())
}

const count = (req, res, next) => {
  utils
    .respondWith(req, res, 'error', 'Method has not yet been implemented.')
    .then(() => next())
}

const search = (req, res, next) => {
  utils
    .respondWith(req, res, 'error', 'Method has not yet been implemented.')
    .then(() => next())
}

const voters = (req, res, next) => {
  utils
    .respondWith(req, res, 'error', 'Method has not yet been implemented.')
    .then(() => next())
}

const fee = (req, res, next) => {
  utils.respondWith(req, res, 'ok', {
    data: config.getConstants(blockchain.status.lastBlock.data.height).fees.delegate
  })

    .then(() => next())
}

const forged = (req, res, next) => {
  utils
    .respondWith(req, res, 'error', 'Method has not yet been implemented.')
    .then(() => next())
}

const next = (req, res, next) => {
  utils
    .respondWith(req, res, 'error', 'Method has not yet been implemented.')
    .then(() => next())
}

const enable = (req, res, next) => {
  utils
    .respondWith(req, res, 'error', 'Method has not yet been implemented.')
    .then(() => next())
}

const disable = (req, res, next) => {
  utils
    .respondWith(req, res, 'error', 'Method has not yet been implemented.')
    .then(() => next())
}

module.exports = {
  index,
  show,
  count,
  search,
  voters,
  fee,
  forged,
  next,
  enable,
  disable,
}
