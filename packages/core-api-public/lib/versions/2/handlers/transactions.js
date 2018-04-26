'use strict';

const Boom = require('boom')

const pluginManager = require('@arkecosystem/core-plugin-manager')
const config = pluginManager.get('config')
const database = pluginManager.get('database')
const blockchainManager = pluginManager.get('blockchain')

const client = require('@arkecosystem/client')
const { Transaction } = client.models
const { TRANSACTION_TYPES } = client.constants

const utils = require('../utils')
const schema = require('../schema/transactions')

/**
 * [index description]
 * @type {Object}
 */
exports.index = {
  handler: async (request, h) => {
    const transactions = await database.transactions.findAll(utils.paginate(request))

    return utils.toPagination(request, transactions, 'transaction')
  }
}

/**
 * [store description]
 * @type {Object}
 */
exports.store = {
  handler: async (request, h) => {
    const transactions = request.payload.transactions
      .map(transaction => Transaction.deserialize(Transaction.serialize(transaction).toString('hex')))

    blockchainManager.postTransactions(transactions)

    return { transactionIds: [] }
  },
  options: {
    validate: schema.store
  }
}

/**
 * [show description]
 * @type {Object}
 */
exports.show = {
  handler: async (request, h) => {
    const transaction = await database.transactions.findById(request.params.id)

    return utils.respondWithResource(request, transaction, 'transaction')
  },
  options: {
    validate: schema.show
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
    const transactions = await blockchainManager.getTransactionHandler().getUnconfirmedTransactions(pagination.offset, pagination.limit)

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

    const transaction = await blockchainManager.getTransactionHandler().getUnconfirmedTransaction(request.param.id)

    return utils.respondWithResource(request, transaction, 'transaction')
  }
}

/**
 * [search description]
 * @type {Object}
 */
exports.search = {
  handler: async (request, h) => {
    const transactions = await database.transactions.search({
      ...request.query,
      ...request.payload,
      ...utils.paginate(request)
    })

    return utils.toPagination(request, transactions, 'transaction')
  },
  options: {
    validate: schema.search
  }
}

/**
 * [types description]
 * @type {Object}
 */
exports.types = {
  handler: async (request, h) => {
    return {
      data: TRANSACTION_TYPES
    }
  }
}
