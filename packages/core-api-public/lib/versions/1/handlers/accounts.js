'use strict';

const { crypto } = require('@arkecosystem/client')

const pluginManager = require('@arkecosystem/core-plugin-manager')
const config = pluginManager.get('config')
const database = pluginManager.get('database')
const blockchainManager = pluginManager.get('blockchain')
const state = blockchainManager.getState()

const utils = require('../utils')
const schema = require('../schemas/accounts')
const { calculateApproval, calculateProductivity } = require('../../../utils/delegate-calculator')

/**
 * @type {Object}
 */
exports.index = {
  handler: async (request, h) => {
    const wallets = await database.wallets.findAll({...request.query, ...utils.paginator(request)})

    return utils.respondWith({
      wallets: utils.toCollection(request, wallets.rows, 'wallet')
    })
  }
}

/**
 * @type {Object}
 */
exports.show = {
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getAccount
      }
    }
  },
  handler: async (request, h) => {
    const account = await database.wallets.findById(request.query.address)

    if (!account) return utils.respondWith('Not found', true)

    return utils.respondWith({ account: utils.toResource(request, account, 'wallet') })
  }
}

/**
 * @type {Object}
 */
exports.balance = {
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getBalance
      }
    }
  },
  handler: async (request, h) => {
    const account = await database.wallets.findById(request.query.address)

    if (!account) return utils.respondWith('Not found', true)

    return utils.respondWith({
      balance: account ? account.balance : '0',
      unconfirmedBalance: account ? account.balance : '0'
    })
  }
}

/**
 * @type {Object}
 */
exports.publicKey = {
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getPublicKey
      }
    }
  },
  handler: async (request, h) => {
    const account = await database.wallets.findById(request.query.address)

    if (!account) return utils.respondWith('Not found', true)

    return utils.respondWith({ publicKey: account.publicKey })
  }
}

/**
 * @type {Object}
 */
exports.fee = {
  handler: (request, h) => {
    return utils.respondWith({
      fee: config.getConstants(state.lastBlock.data.height).fees.delegate
    })
  }
}

/**
 * @type {Object}
 */
exports.delegates = {
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getDelegates
      }
    }
  },
  handler: async (request, h) => {
    let account = await database.wallets.findById(request.query.address)

    if (!account) return utils.respondWith('Address not found.', true)
    if (!account.vote) return utils.respondWith(`Address ${request.query.address} hasn't voted yet.`, true)

    const delegates = await database.getActiveDelegates(state.lastBlock.data.height)
    const delegateRank = delegates.findIndex(d => d.publicKey === account.vote)
    const delegate = delegates[delegateRank] || {}

    account = await database.wallets.findById(crypto.getAddress(account.vote, config.network.pubKeyHash))

    return utils.respondWith({
      delegates: [{
        username: account.username,
        address: account.address,
        publicKey: account.publicKey,
        vote: delegate.balance + '',
        producedblocks: account.producedBlocks,
        missedblocks: account.missedBlocks,
        rate: delegateRank + 1,
        approval: calculateApproval(delegate),
        productivity: calculateProductivity(account)
      }]
    })
  }
}

/**
 * @type {Object}
 */
exports.top = {
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.top
      }
    }
  },
  handler: async (request, h) => {
    let accounts = await database.wallets.top(utils.paginator(request), true)

    accounts = accounts.map((a) => ({
      address: a.address,
      balance: a.balance,
      publicKey: a.publicKey
    }))

    return utils.respondWith({ accounts })
  }
}

/**
 * @type {Object}
 */
exports.count = {
  handler: async (request, h) => {
    const accounts = await database.wallets.findAll()

    return utils.respondWith({ count: accounts.length })
  }
}
