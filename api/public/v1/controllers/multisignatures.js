const utils = require('../utils')

class MultiSignaturesController {
  index (req, res, next) {
    utils.respondWith('error', 'Method has not yet been implemented.')
  }

  store (req, res, next) {
    utils.respondWith('error', 'Method has not yet been implemented.')
  }

  pending (req, res, next) {
    utils.respondWith('error', 'Method has not yet been implemented.')
  }

  accounts (req, res, next) {
    utils.respondWith('error', 'Method has not yet been implemented.')
  }
}

module.exports = new MultiSignaturesController()
