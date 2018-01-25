const utils = require('../utils')

class MultiSignaturesController {
  index (req, res, next) {
    utils.respondWith('notImplemented', 'Method has not yet been implemented.')

    next()
  }

  pending (req, res, next) {
    utils.respondWith('notImplemented', 'Method has not yet been implemented.')

    next()
  }

  wallets (req, res, next) {
    utils.respondWith('notImplemented', 'Method has not yet been implemented.')

    next()
  }
}

module.exports = new MultiSignaturesController()
