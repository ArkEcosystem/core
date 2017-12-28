const blockchain = requireFrom('core/blockchainManager')
const config = requireFrom('core/config')
const responder = requireFrom('api/responder')

class DelegatesController {
  index(req, res, next) {
    responder.notImplemented(res, 'Method has not yet been implemented.')

    next()
  }

  show(req, res, next) {
    responder.notImplemented(res, 'Method has not yet been implemented.')

    next()
  }

  count(req, res, next) {
    responder.notImplemented(res, 'Method has not yet been implemented.')

    next()
  }

  search(req, res, next) {
    responder.notImplemented(res, 'Method has not yet been implemented.')

    next()
  }

  voters(req, res, next) {
    responder.notImplemented(res, 'Method has not yet been implemented.')

    next()
  }

  fee(req, res, next) {
    res.send({
      data: config.getConstants(blockchain.getInstance().lastBlock.data.height).fees.delegate
    })

    next()
  }

  forged(req, res, next) {
    responder.notImplemented(res, 'Method has not yet been implemented.')

    next()
  }

  next(req, res, next) {
    responder.notImplemented(res, 'Method has not yet been implemented.')

    next()
  }

  enable(req, res, next) {
    responder.notImplemented(res, 'Method has not yet been implemented.')

    next()
  }

  disable(req, res, next) {
    responder.notImplemented(res, 'Method has not yet been implemented.')

    next()
  }

}

module.exports = new DelegatesController
