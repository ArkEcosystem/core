const blockchain = require(__root + 'core/blockchainManager')
const config = require(__root + 'core/config')
const responseOk = require(__root + 'api/public/v1/responses/ok')

class SignaturesController {
  index(req, res, next) {
    res.send({
      data: '/api/signatures'
    })

    next()
  }

  fee(req, res, next) {
    res.send({
      data: '/api/signatures/fee'
    })

    next()
  }
}

module.exports = new SignaturesController
