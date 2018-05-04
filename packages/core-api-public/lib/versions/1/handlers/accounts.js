'use strict'

const { crypto } = require('@arkecosystem/client')

const container = require('@arkecosystem/core-container')
const config = container.get('config')
const database = container.get('database')
const blockchain = container.get('blockchain')

const utils = require('../utils')
const schema = require('../schemas/accounts')
const { calculateApproval, calculateProductivity } = require('../../../utils/delegate-calculator')

/**
 * @type {Object}
 */
exports.index = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
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
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler: async (request, h) => {
    const account = await database.wallets.findById(request.query.address)

    if (!account) {
      return utils.respondWith('Not found', true)
    }

    return utils.respondWith({ account: utils.toResource(request, account, 'wallet') })
  },
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getAccount
      }
    }
  }
}

/**
 * @type {Object}
 */
exports.balance = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler: async (request, h) => {
    const account = await database.wallets.findById(request.query.address)

    if (!account) {
      return utils.respondWith('Not found', true)
    }

    return utils.respondWith({
      balance: account ? account.balance : '0',
      unconfirmedBalance: account ? account.balance : '0'
    })
  },
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getBalance
      }
    }
  }
}

/**
 * @type {Object}
 */
exports.publicKey = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler: async (request, h) => {
    const account = await database.wallets.findById(request.query.address)

    if (!account) {
      return utils.respondWith('Not found', true)
    }

    return utils.respondWith({ publicKey: account.publicKey })
  },
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getPublicKey
      }
    }
  }
}

/**
 * @type {Object}
 */
exports.fee = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler: (request, h) => {
    return utils.respondWith({
      fee: config.getConstants(blockchain.getLastBlock(true).height).fees.delegate
    })
  }
}

/**
 * @type {Object}
 */
exports.delegates = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler: async (request, h) => {
    let account = await database.wallets.findById(request.query.address)

    if (!account) {
      return utils.respondWith('Address not found.', true)
    }

    if (!account.vote) {
      return utils.respondWith(`Address ${request.query.address} hasn't voted yet.`, true)
    }

    const delegates = await database.getActiveDelegates(blockchain.getLastBlock(true).height)
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
  },
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getDelegates
      }
    }
  }
}

/**
 * @type {Object}
 */
exports.top = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler: async (request, h) => {
    let accounts = await database.wallets.top(utils.paginator(request), true)

    accounts = accounts.map((a) => ({
      address: a.address,
      balance: a.balance,
      publicKey: a.publicKey
    }))

    return utils.respondWith({ accounts })
  },
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.top
      }
    }
  }
}

/**
 * @type {Object}
 */
exports.count = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler: async (request, h) => {
    const accounts = await database.wallets.findAll()

    return utils.respondWith({ count: accounts.length })
  }
}
