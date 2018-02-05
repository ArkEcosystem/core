const Boom = require('boom')
const blockchain = require('app/core/blockchainManager').getInstance()
const config = require('app/core/config')
const db = require('app/core/dbinterface').getInstance()
const utils = require('../utils')

exports.index = {
  handler: (request, h) => {
    return db.delegates
      .findAll()
      .then(delegates => utils.toCollection(request, delegates, 'delegate'))
      .then(delegates => utils.respondWith({delegates}))
  }
}

exports.show = {
  handler: (request, h) => {
    return db.delegates
      .findById(request.query.id)
      .then(delegate => utils.toResource(request, delegate, 'delegate'))
      .then(delegate => utils.respondWith({delegate}))
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
