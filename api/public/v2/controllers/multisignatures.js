const helpers = require('../helpers')

class MultiSignaturesController {
  index (req, res, next) {
    helpers.respondWith('notImplemented', 'Method has not yet been implemented.')
  }

  pending (req, res, next) {
    helpers.respondWith('notImplemented', 'Method has not yet been implemented.')
  }

  wallets (req, res, next) {
    helpers.respondWith('notImplemented', 'Method has not yet been implemented.')
  }
}

module.exports = new MultiSignaturesController()
