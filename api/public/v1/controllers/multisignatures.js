const helpers = require('../helpers')

class MultiSignaturesController {
  index (req, res, next) {
    helpers.respondWith('error', 'Method has not yet been implemented.')
  }

  store (req, res, next) {
    helpers.respondWith('error', 'Method has not yet been implemented.')
  }

  pending (req, res, next) {
    helpers.respondWith('error', 'Method has not yet been implemented.')
  }

  accounts (req, res, next) {
    helpers.respondWith('error', 'Method has not yet been implemented.')
  }
}

module.exports = new MultiSignaturesController()
