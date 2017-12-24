const blockchain = require(__root + 'core/blockchainManager')
const config = require(__root + 'core/config')
const responseOk = require(__root + 'api/public/v2/responses/ok')

class ForgingController {
  round(req, res, next) {
    res.send({
      data: '/api/forging/round'
    })

    next()
  }

  next(req, res, next) {
    res.send({
      data: '/api/forging/next'
    })

    next()
  }

  previous(req, res, next) {
    res.send({
      data: '/api/forging/previous'
    })

    next()
  }
}

module.exports = new ForgingController
