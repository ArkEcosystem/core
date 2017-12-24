const blockchain = require(__root + 'core/blockchainManager')
const config = require(__root + 'core/config')
const responseOk = require(__root + 'api/public/v1/responses/ok')

class DelegatesController {
  index(req, res, next) {
    res.send({
      data: '/api/delegates'
    })

    next()
  }

  show(req, res, next) {
    res.send({
      data: '/api/delegates/get'
    })

    next()
  }

  count(req, res, next) {
    res.send({
      data: '/api/delegates/count'
    })

    next()
  }

  search(req, res, next) {
    res.send({
      data: '/api/delegates/search'
    })

    next()
  }

  voters(req, res, next) {
    res.send({
      data: '/api/delegates/voters'
    })

    next()
  }

  fee(req, res, next) {
    res.send({
      data: config.getConstants(blockchain.getInstance().lastBlock.data.height).fees.delegate
    })

    next()
  }

  forged(req, res, next) {
    res.send({
      data: '/api/delegates/forging/getForgedByAccount'
    })

    next()
  }

  next(req, res, next) {
    res.send({
      data: '/api/delegates/getNextForgers'
    })

    next()
  }

  enable(req, res, next) {
    res.send({
      data: '/api/delegates/forging/enable'
    })

    next()
  }

  disable(req, res, next) {
    res.send({
      data: '/api/delegates/forging/disable'
    })

    next()
  }

}

module.exports = new DelegatesController
