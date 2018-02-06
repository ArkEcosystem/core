const Boom = require('boom')
const blockchain = require('app/core/blockchainManager').getInstance()
const config = require('app/core/config')
const db = require('app/core/dbinterface').getInstance()
const utils = require('../utils')
const schema = require('../schemas/delegates')

exports.index = {
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getDelegates
      }
    }
  },
  handler: (request, h) => {
    return db.delegates
      .findAll()
      .then(delegates => utils.toCollection(request, delegates, 'delegate'))
      .then(delegates => utils.respondWith({delegates}))
  }
}

exports.show = {
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getDelegate
      }
    }
  },
  handler: (request, h) => {
    return db.delegates
      .findById(request.query.id)
      .then(delegate => utils.toResource(request, delegate, 'delegate'))
      .then(delegate => utils.respondWith({delegate}))
  }
}

exports.count = {
  handler: (request, h) => {
    return db.delegates
      .findAll()
      .then(delegates => utils.respondWith({ count: delegates.length }))
  }
}

exports.search = {
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.search
      }
    }
  },
  handler: (request, h) => {
    return db.delegates
      .search({...request.query, ...utils.paginator(request)})
      .then(delegates => utils.toCollection(request, delegates.rows, 'delegate'))
      .then(delegates => utils.respondWith({delegates}))
  }
}

exports.voters = {
  handler: (request, h) => {
    return db.delegates
      .findById(request.query.publicKey)
      .then(delegate => db.wallets.findAllByVote(delegate.publicKey))
      .then(accounts => utils.toCollection(request, accounts, 'voter'))
      .then(accounts => utils.respondWith({accounts}))
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
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getForgedByAccount
      }
    }
  },
  handler: (request, h) => {
    return db.blocks
      .totalsByGenerator(request.query.generatorPublicKey)
      .then(totals => utils.respondWith(totals[0]))
  }
}
