'use strict';

const blockchain = require('@arkecosystem/core-pluggy').get('blockchain')
const state = blockchain.getState()
const config = require('@arkecosystem/core-pluggy').get('config')
const db = require('@arkecosystem/core-pluggy').get('database')
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
  handler: async (request, h) => {
    const delegates = await db.delegates.findAll()

    return utils.respondWith({
      delegates: utils.toCollection(request, delegates, 'delegate')
    })
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
  handler: async (request, h) => {
    const delegate = await db.delegates.findById(request.query.id)

    return utils.respondWith({
      delegate: utils.toResource(request, delegate, 'delegate')
    })
  }
}

exports.count = {
  handler: async (request, h) => {
    const delegates = await db.delegates.findAll()

    return utils.respondWith({ count: delegates.length })
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
  handler: async (request, h) => {
    const delegates = await db.delegates.search({...request.query, ...utils.paginator(request)})

    return utils.respondWith({
      delegates: utils.toCollection(request, delegates.rows, 'delegate')
    })
  }
}

exports.voters = {
  handler: async (request, h) => {
    const delegate = await db.delegates.findById(request.query.publicKey)
    const accounts = await db.wallets.findAllByVote(delegate.publicKey)

    return utils.respondWith({
      accounts: utils.toCollection(request, accounts, 'voter')
    })
  }
}

exports.fee = {
  handler: (request, h) => {
    return utils.respondWith({
      data: config.getConstants(state.lastBlock.data.height).fees.delegate
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
  handler: async (request, h) => {
    const totals = await db.blocks.totalsByGenerator(request.query.generatorPublicKey)

    return utils.respondWith(totals[0])
  }
}
