const arkjs = require('arkjs')
const blockchain = require('app/core/managers/blockchain').getInstance()
const state = blockchain.getState()
const config = require('app/core/config')
const db = require('app/core/dbinterface').getInstance()
const utils = require('../utils')
const schema = require('../schemas/accounts')
const { calculateApproval, calculateProductivity } = require('app/utils/delegate-calculator')

exports.index = {
  handler: async (request, h) => {
    const wallets = await db.wallets.findAll({...request.query, ...utils.paginator(request)})

    return utils.respondWith({
      wallets: utils.toCollection(request, wallets.rows, 'wallet')
    })
  }
}

exports.show = {
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getAccount
      }
    }
  },
  handler: async (request, h) => {
    const account = await db.wallets.findById(request.query.address)

    if (!account) return utils.respondWith('Not found', true)

    return utils.respondWith({ account: utils.toResource(request, account, 'wallet') })
  }
}

exports.balance = {
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getBalance
      }
    }
  },
  handler: async (request, h) => {
    const account = await db.wallets.findById(request.query.address)

    if (!account) return utils.respondWith('Not found', true)

    return utils.respondWith({
      balance: account ? account.balance : '0',
      unconfirmedBalance: account ? account.balance : '0'
    })
  }
}

exports.publicKey = {
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getPublicKey
      }
    }
  },
  handler: async (request, h) => {
    const account = await db.wallets.findById(request.query.address)

    if (!account) return utils.respondWith('Not found', true)

    return utils.respondWith({ publicKey: account.publicKey })
  }
}

exports.fee = {
  handler: (request, h) => {
    return utils.respondWith({
      fee: config.getConstants(state.lastBlock.data.height).fees.delegate
    })
  }
}

exports.delegates = {
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getDelegates
      }
    }
  },
  handler: async (request, h) => {
    let account = await db.wallets.findById(request.query.address)

    if (!account) return utils.respondWith('Address not found.', true)
    if (!account.vote) return utils.respondWith(`Address ${request.query.address} hasn't voted yet.`, true)

    const delegates = await db.getActiveDelegates(state.lastBlock.data.height)
    const delegateRank = delegates.findIndex(d => d.publicKey === account.vote)
    const delegate = delegates[delegateRank] || {}

    account = await db.wallets.findById(arkjs.crypto.getAddress(account.vote, config.network.pubKeyHash))

    return utils.respondWith({
      delegates: [{
        username: account.username,
        address: account.address,
        publicKey: account.publicKey,
        vote: delegate.balance + '',
        producedblocks: account.producedBlocks,
        missedblocks: account.missedBlocks, // TODO how?
        rate: delegateRank + 1,
        approval: calculateApproval(delegate),
        productivity: calculateProductivity(account)
      }]
    })
  }
}

exports.top = {
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.top
      }
    }
  },
  handler: async (request, h) => {
    const accounts = await db.wallets.top(request.query)

    return utils.respondWith({ wallets: accounts.rows })
  }
}

exports.count = {
  handler: async (request, h) => {
    const accounts = await db.wallets.findAll()

    return utils.respondWith({ count: accounts.count })
  }
}
