'use strict';

const Boom = require('boom')
const config = require('@arkecosystem/core-plugin-manager').get('config')
const chainInstance = require('@arkecosystem/core-plugin-manager').get('blockchain')
const db = require('@arkecosystem/core-plugin-manager').get('database')
const utils = require('../utils')
const schema = require('../schemas/transactions')

/**
 * [index description]
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
    const transactions = await db.transactions.findAll({
      ...request.query, ...utils.paginator(request)
    }, false)

    if (!transactions) return utils.respondWith('No transactions found', true)

    return utils.respondWith({
      transactions: utils.toCollection(request, transactions, 'transaction')
    })
  }
}

/**
 * [show description]
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
    const result = await db.transactions.findById(request.query.id)

    if (!result) return utils.respondWith('No transactions found', true)

    return utils.respondWith({ transaction: utils.toResource(request, result, 'transaction') })
  }
}

/**
 * [unconfirmed description]
 * @type {Object}
 */
exports.unconfirmed = {
  handler: async (request, h) => {
    if (!config.server.transactionPool.enabled) {
      return Boom.teapot('Transaction Pool disabled...');
    }

    const pagination = utils.paginate(request)
    const transactions = await chainInstance.getTransactionHandler().getUnconfirmedTransactions(pagination.offset, pagination.limit)

    return utils.toPagination({
      count: transactions.length,
      rows: transactions
    }, transactions, 'transaction')
  }
}

/**
 * [showUnconfirmed description]
 * @type {Object}
 */
exports.showUnconfirmed = {
  handler: async (request, h) => {
    if (!config.server.transactionPool.enabled) {
      return Boom.teapot('Transaction Pool disabled...');
    }

    const transaction = await chainInstance.getTransactionHandler().getUnconfirmedTransaction(request.param.id)

    return utils.respondWithResource(request, transaction, 'transaction')
  }
}
