const blockchain = requireFrom('core/blockchainManager')
const config = requireFrom('core/config')
const responder = requireFrom('api/responder')

class ForgingController {
  round(req, res, next) {
    responder.notImplemented(res, 'Method has not yet been implemented.')

    next()
  }

  next(req, res, next) {
    responder.notImplemented(res, 'Method has not yet been implemented.')

    next()
  }

  previous(req, res, next) {
    responder.notImplemented(res, 'Method has not yet been implemented.')

    next()
  }
}

module.exports = new ForgingController
