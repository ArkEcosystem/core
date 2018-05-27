'use strict'

const { crypto } = require('@arkecosystem/crypto')

const container = require('@arkecosystem/core-container')
const config = container.resolvePlugin('config')
const database = container.resolvePlugin('database')
const blockchain = container.resolvePlugin('blockchain')

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
  async handler (request, h) {
    const { rows } = await database.wallets.findAll({
      ...request.query, ...utils.paginator(request)
    })

    return utils.respondWith({
      accounts: utils.toCollection(request, rows, 'account')
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
  async handler (request, h) {
    const account = await database.wallets.findById(request.query.address)

    if (!account) {
      return utils.respondWith('Not found', true)
    }

    return utils.respondWith({
      account: utils.toResource(request, account, 'account')
    })
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
  async handler (request, h) {
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
  async handler (request, h) {
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
  handler (request, h) {
    return utils.respondWith({
      fee: config.getConstants(blockchain.getLastBlock(true).height).fees.delegateRegistration
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
  async handler (request, h) {
    let account = await database.wallets.findById(request.query.address)

    if (!account) {
      return utils.respondWith('Address not found.', true)
    }

    if (!account.vote) {
      return utils.respondWith(`Address ${request.query.address} hasn't voted yet.`, true)
    }

    // TODO: refactor this to be reusable - delegate manager?
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
        forged: account.forged,
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
  async handler (request, h) {
    let accounts = database.wallets.top(utils.paginator(request))

    accounts = accounts.rows.map(account => ({
      address: account.address,
      balance: account.balance,
      publicKey: account.publicKey
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
  async handler (request, h) {
    const { count } = await database.wallets.findAll()

    return utils.respondWith({ count })
  }
}
