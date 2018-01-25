const blockchain = requireFrom('core/blockchainManager').getInstance()
const config = requireFrom('core/config')
const db = requireFrom('core/dbinterface').getInstance()
const utils = require('../utils')

class DelegatesController {
  index (req, res, next) {
    db.delegates
      .findAll()
      .then(delegates => utils.respondWith('ok', {delegates}))
  }

  show (req, res, next) {
    utils.respondWith('error', 'Method has not yet been implemented.')
  }

  count (req, res, next) {
    utils.respondWith('error', 'Method has not yet been implemented.')
  }

  search (req, res, next) {
    utils.respondWith('error', 'Method has not yet been implemented.')
  }

  voters (req, res, next) {
    utils.respondWith('error', 'Method has not yet been implemented.')
  }

  fee (req, res, next) {
    utils.respondWith('ok', {
      data: config.getConstants(blockchain.status.lastBlock.data.height).fees.delegate
    })
  }

  forged (req, res, next) {
    utils.respondWith('error', 'Method has not yet been implemented.')
  }

  next (req, res, next) {
    utils.respondWith('error', 'Method has not yet been implemented.')
  }

  enable (req, res, next) {
    utils.respondWith('error', 'Method has not yet been implemented.')
  }

  disable (req, res, next) {
    utils.respondWith('error', 'Method has not yet been implemented.')
  }
}

module.exports = new DelegatesController()
