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
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getTransactions
      }
    }
  },
  handler: async (request, h) => {
    const transactions = await database.transactions.findAll({
      ...request.query, ...utils.paginator(request)
    }, false)

    if (!transactions) return utils.respondWith('No transactions found', true)

    return utils.respondWith({
      transactions: utils.toCollection(request, transactions, 'transaction')
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
        querySchema: schema.getTransaction
      }
    }
  },
  handler: async (request, h) => {
    const result = await database.transactions.findById(request.query.id)

    if (!result) return utils.respondWith('No transactions found', true)

    return utils.respondWith({ transaction: utils.toResource(request, result, 'transaction') })
  }
}

/**
 * @type {Object}
 */
exports.unconfirmed = {
  handler: async (request, h) => {
    if (!config.server.transactionPool.enabled) {
      return Boom.teapot('Transaction Pool disabled...');
    }

    const pagination = utils.paginate(request)
    const transactions = await blockchainManager.getTransactionHandler().getUnconfirmedTransactions(pagination.offset, pagination.limit)

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
  handler: async (request, h) => {
    if (!config.server.transactionPool.enabled) {
      return Boom.teapot('Transaction Pool disabled...');
    }

    const transaction = await blockchainManager.getTransactionHandler().getUnconfirmedTransaction(request.param.id)

    return utils.respondWithResource(request, transaction, 'transaction')
  }
}
