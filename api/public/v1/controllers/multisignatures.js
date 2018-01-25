const utils = require('../utils')

class MultiSignaturesController {
  index (req, res, next) {
    utils
      .respondWith('error', 'Method has not yet been implemented.')
      .then(() => next())
  }

  store (req, res, next) {
    utils
      .respondWith('error', 'Method has not yet been implemented.')
      .then(() => next())
  }

  pending (req, res, next) {
    utils
      .respondWith('error', 'Method has not yet been implemented.')
      .then(() => next())
  }

  accounts (req, res, next) {
    utils
      .respondWith('error', 'Method has not yet been implemented.')
      .then(() => next())
  }
}

module.exports = new MultiSignaturesController()
