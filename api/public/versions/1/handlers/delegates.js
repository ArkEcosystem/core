const Boom = require('boom')
const blockchain = requireFrom('core/blockchainManager').getInstance()
const config = requireFrom('core/config')
const db = requireFrom('core/dbinterface').getInstance()
const utils = require('../utils')

exports.index = {
  handler: (request, h) => {
    return db.delegates
      .findAll()
      .then(delegates => utils.respondWith({delegates}))
  }
}

exports.show = {
  handler: (request, h) => {
    return Boom.notImplemented()
  }
}

exports.count = {
  handler: (request, h) => {
    return Boom.notImplemented()
  }
}

exports.search = {
  handler: (request, h) => {
    return Boom.notImplemented()
  }
}

exports.voters = {
  handler: (request, h) => {
    return Boom.notImplemented()
  }
}

exports.fee = {
  handler: (request, h) => {
    return utils.respondWith({
      data: config.getConstants(blockchain.status.lastBlock.data.height).fees.delegate
    })
  }
}

exports.forged = {
  handler: (request, h) => {
    return Boom.notImplemented()
  }
}

exports.next = {
  handler: (request, h) => {
    return Boom.notImplemented()
  }
}

exports.enable = {
  handler: (request, h) => {
    return Boom.notImplemented()
  }
}

exports.disable = {
  handler: (request, h) => {
    return Boom.notImplemented()
  }
}
