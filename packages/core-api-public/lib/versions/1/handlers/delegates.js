'use strict';

const pluginManager = require('@arkecosystem/core-plugin-manager')
const config = pluginManager.get('config')
const database = pluginManager.get('database')
const blockchainManager = pluginManager.get('blockchain')
const state = blockchainManager.getState()

const utils = require('../utils')
const schema = require('../schemas/delegates')

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
    const delegates = await database.delegates.findAll()

    return utils.respondWith({
      delegates: utils.toCollection(request, delegates, 'delegate')
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
exports.show = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler: async (request, h) => {
    const delegate = await database.delegates.findById(request.query.id)

    return utils.respondWith({
      delegate: utils.toResource(request, delegate, 'delegate')
    })
  },
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getDelegate
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
    const delegates = await database.delegates.findAll()

    return utils.respondWith({ count: delegates.length })
  }
}

/**
 * @type {Object}
 */
exports.search = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler: async (request, h) => {
    const delegates = await database.delegates.search({...request.query, ...utils.paginator(request)})

    return utils.respondWith({
      delegates: utils.toCollection(request, delegates.rows, 'delegate')
    })
  },
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.search
      }
    }
  }
}

/**
 * @type {Object}
 */
exports.voters = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler: async (request, h) => {
    const delegate = await database.delegates.findById(request.query.publicKey)
    const accounts = await database.wallets.findAllByVote(delegate.publicKey)

    return utils.respondWith({
      accounts: utils.toCollection(request, accounts, 'voter')
    })
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
      data: config.getConstants(state.lastBlock.data.height).fees.delegate
    })
  }
}

/**
 * @type {Object}
 */
exports.forged = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler: async (request, h) => {
    const totals = await database.blocks.totalsByGenerator(request.query.generatorPublicKey)

    return utils.respondWith(totals[0])
  },
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getForgedByAccount
      }
    }
  }
}
