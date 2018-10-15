'use strict'

const container = require('@arkecosystem/core-container')
const config = container.resolvePlugin('config')
const database = container.resolvePlugin('database')
const blockchain = container.resolvePlugin('blockchain')

const utils = require('../utils')
const schema = require('../schemas/accounts')

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
      ...request.query, ...utils.paginate(request)
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
      return utils.respondWith('Account not found', true)
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
      return utils.respondWith({ balance: '0', unconfirmedBalance: '0' })
    }

    return utils.respondWith({
      balance: account ? `${account.balance}` : '0',
      unconfirmedBalance: account ? `${account.balance}` : '0'
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
      return utils.respondWith('Account not found', true)
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
      fee: config.getConstants(blockchain.getLastBlock().data.height).fees.delegateRegistration
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

    const delegate = await database.delegates.findById(account.vote)

    return utils.respondWith({
      delegates: [utils.toResource(request, delegate, 'delegate')]
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
    let accounts = database.wallets.top(utils.paginate(request))

    accounts = accounts.rows.map(account => ({
      address: account.address,
      balance: account.balance + '',
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
