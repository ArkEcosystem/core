const blockchain = requireFrom('core/blockchainManager').getInstance()
const config = requireFrom('core/config')
const db = requireFrom('core/dbinterface').getInstance()
const utils = require('../utils')

class DelegatesController {
  index (req, res, next) {
    db.delegates
      .findAll()
      .then(delegates => utils.respondWith('ok', {delegates}))
      .then(() => next())
  }

  show (req, res, next) {
    utils
      .respondWith('error', 'Method has not yet been implemented.')
      .then(() => next())
  }

  count (req, res, next) {
    utils
      .respondWith('error', 'Method has not yet been implemented.')
      .then(() => next())
  }

  search (req, res, next) {
    utils
      .respondWith('error', 'Method has not yet been implemented.')
      .then(() => next())
  }

  voters (req, res, next) {
    utils
      .respondWith('error', 'Method has not yet been implemented.')
      .then(() => next())
  }

  fee (req, res, next) {
    utils.respondWith('ok', {
      data: config.getConstants(blockchain.status.lastBlock.data.height).fees.delegate
    })

      .then(() => next())
  }

  forged (req, res, next) {
    utils
      .respondWith('error', 'Method has not yet been implemented.')
      .then(() => next())
  }

  next (req, res, next) {
    utils
      .respondWith('error', 'Method has not yet been implemented.')
      .then(() => next())
  }

  enable (req, res, next) {
    utils
      .respondWith('error', 'Method has not yet been implemented.')
      .then(() => next())
  }

  disable (req, res, next) {
    utils
      .respondWith('error', 'Method has not yet been implemented.')
      .then(() => next())
  }
}

module.exports = new DelegatesController()
