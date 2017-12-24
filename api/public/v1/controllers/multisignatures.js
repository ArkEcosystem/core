const blockchain = require(__root + 'core/blockchainManager')
const config = require(__root + 'core/config')
const responseOk = require(__root + 'api/public/v1/responses/ok')

class MultiSignaturesController {
  index(req, res, next) {
    res.send({
      data: '/api/multisignatures'
    })

    next()
  }

  store(req, res, next) {
    res.send({
      data: '/api/multisignatures'
    })

    next()
  }

  pending(req, res, next) {
    res.send({
      data: '/api/multisignatures/pending'
    })

    next()
  }

  accounts(req, res, next) {
    res.send({
      data: '/api/multisignatures/accounts'
    })

    next()
  }
}

module.exports = new MultiSignaturesController
