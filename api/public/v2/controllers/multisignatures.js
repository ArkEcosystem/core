const utils = require('../utils')

class MultiSignaturesController {
  index (req, res, next) {
    utils.respondWith('notImplemented', 'Method has not yet been implemented.')
  }

  pending (req, res, next) {
    utils.respondWith('notImplemented', 'Method has not yet been implemented.')
  }

  wallets (req, res, next) {
    utils.respondWith('notImplemented', 'Method has not yet been implemented.')
  }
}

module.exports = new MultiSignaturesController()
