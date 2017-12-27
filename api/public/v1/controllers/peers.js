const blockchain = require(`${__root}/core/blockchainManager`)
const config = require(`${__root}/core/config`)
const responder = require(`${__root}/api/responder`)

class PeersController {
  index(req, res, next) {
    responder.notImplemented(res, 'Method has not yet been implemented.');

    next()
  }

  show(req, res, next) {
    responder.notImplemented(res, 'Method has not yet been implemented.');

    next()
  }

  version(req, res, next) {
    responder.notImplemented(res, 'Method has not yet been implemented.');

    next()
  }
}

module.exports = new PeersController
