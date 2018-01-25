const utils = require('../utils')

class MultiSignaturesController {
  index (req, res, next) {
    utils
      .respondWith('notImplemented', 'Method has not yet been implemented.')
      .then(() => next())
  }

  pending (req, res, next) {
    utils
      .respondWith('notImplemented', 'Method has not yet been implemented.')
      .then(() => next())
  }

  wallets (req, res, next) {
    utils
      .respondWith('notImplemented', 'Method has not yet been implemented.')
      .then(() => next())
  }
}

module.exports = new MultiSignaturesController()
