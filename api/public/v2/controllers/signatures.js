const utils = require('../utils')

class SignaturesController {
  index (req, res, next) {
    utils.respondWith('notImplemented', 'Method has not yet been implemented.')

    next()
  }
}

module.exports = new SignaturesController()
