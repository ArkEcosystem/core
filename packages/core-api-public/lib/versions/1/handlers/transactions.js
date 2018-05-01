'use strict';

const Boom = require('boom')

const pluginManager = require('@arkecosystem/core-plugin-manager')
const config = pluginManager.get('config')
const database = pluginManager.get('database')
const blockchainManager = pluginManager.get('blockchain')

const utils = require('../utils')
const schema = require('../schemas/transactions')

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
    const transactions = await database.transactions.findAll({
      ...request.query, ...utils.paginator(request)
    }, false)

    if (!transactions) return utils.respondWith('No transactions found', true)

    return utils.respondWith({
      transactions: utils.toCollection(request, transactions, 'transaction')
    })
  },
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getTransactions
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
    const result = await database.transactions.findById(request.query.id)

    if (!result) return utils.respondWith('No transactions found', true)

    return utils.respondWith({ transaction: utils.toResource(request, result, 'transaction') })
  },
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getTransaction
      }
    }
  }
}

/**
 * @type {Object}
 */
exports.unconfirmed = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler: async (request, h) => {
    if (!config.server.transactionPool.enabled) {
      return Boom.teapot('Transaction Pool disabled...');
    }

    const pagination = utils.paginate(request)
    const transactions = await blockchainManager.getTransactionPool().getTransactions(pagination.offset, pagination.limit)

    return utils.toPagination({
      count: transactions.length,
      rows: transactions
    }, transactions, 'transaction')
  }
}

/**
 * @type {Object}
 */
exports.showUnconfirmed = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler: async (request, h) => {
    if (!config.server.transactionPool.enabled) {
      return Boom.teapot('Transaction Pool disabled...');
    }

    const transaction = await blockchainManager.getTransactionPool().getTransaction(request.param.id)

    return utils.respondWithResource(request, transaction, 'transaction')
  }
}
