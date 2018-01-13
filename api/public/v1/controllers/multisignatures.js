const responder = requireFrom('api/responder')

class MultiSignaturesController {
  index (req, res, next) {
    responder.notImplemented(res, 'Method has not yet been implemented.')

    next()
  }

  store (req, res, next) {
    responder.notImplemented(res, 'Method has not yet been implemented.')

    next()
  }

  pending (req, res, next) {
    responder.notImplemented(res, 'Method has not yet been implemented.')

    next()
  }

  accounts (req, res, next) {
    responder.notImplemented(res, 'Method has not yet been implemented.')

    next()
  }
}

module.exports = new MultiSignaturesController()
