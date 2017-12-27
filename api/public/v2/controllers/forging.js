const blockchain = require(`${__root}/core/blockchainManager`)
const config = require(`${__root}/core/config`)
const responder = require(`${__root}/api/responder`)

class ForgingController {
  round(req, res, next) {
    responder.notImplemented(res, 'Method has not yet been implemented.');

    next()
  }

  next(req, res, next) {
    responder.notImplemented(res, 'Method has not yet been implemented.');

    next()
  }

  previous(req, res, next) {
    responder.notImplemented(res, 'Method has not yet been implemented.');

    next()
  }
}

module.exports = new ForgingController
