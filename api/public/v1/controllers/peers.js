const blockchain = require(__root + 'core/blockchainManager')
const config = require(__root + 'core/config')
const responseOk = require(__root + 'api/public/v1/responses/ok')

class PeersController {
  index(req, res, next) {
    res.send({
      data: '/api/peers'
    })

    next()
  }

  show(req, res, next) {
    res.send({
      data: '/api/peers/get'
    })

    next()
  }

  version(req, res, next) {
    res.send({
      data: '/api/peers/version'
    })

    next()
  }
}

module.exports = new PeersController
