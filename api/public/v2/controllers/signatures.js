const helpers = require('../helpers')

class SignaturesController {
  index (req, res, next) {
    helpers.respondWith('notImplemented', 'Method has not yet been implemented.')
  }
}

module.exports = new SignaturesController()
