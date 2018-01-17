const blockchain = requireFrom('core/blockchainManager')
const config = requireFrom('core/config')
const db = requireFrom('core/dbinterface').getInstance()
const helpers = require('../helpers')

class DelegatesController {
  index (req, res, next) {
    db.delegates.all().then(result => {
      helpers.respondWith('ok', {
        data: result
      })
    })
  }

  show (req, res, next) {
    helpers.respondWith('notImplemented', 'Method has not yet been implemented.')
  }

  count (req, res, next) {
    helpers.respondWith('notImplemented', 'Method has not yet been implemented.')
  }

  search (req, res, next) {
    helpers.respondWith('notImplemented', 'Method has not yet been implemented.')
  }

  voters (req, res, next) {
    helpers.respondWith('notImplemented', 'Method has not yet been implemented.')
  }

  fee (req, res, next) {
    helpers.respondWith('ok', {
      data: config.getConstants(blockchain.getInstance().status.lastBlock.data.height).fees.delegate
    })
  }

  forged (req, res, next) {
    helpers.respondWith('notImplemented', 'Method has not yet been implemented.')
  }

  next (req, res, next) {
    helpers.respondWith('notImplemented', 'Method has not yet been implemented.')
  }

  enable (req, res, next) {
    helpers.respondWith('notImplemented', 'Method has not yet been implemented.')
  }

  disable (req, res, next) {
    helpers.respondWith('notImplemented', 'Method has not yet been implemented.')
  }
}

module.exports = new DelegatesController()
