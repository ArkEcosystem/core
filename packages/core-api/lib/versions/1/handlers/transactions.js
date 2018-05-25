'use strict'

const Boom = require('boom')

const container = require('@arkecosystem/core-container')
const config = container.resolvePlugin('config')
const database = container.resolvePlugin('database')
const blockchain = container.resolvePlugin('blockchain')

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
  async handler (request, h) {
    const transactions = await database.transactions.findAll({
      ...request.query, ...utils.paginator(request)
    }, false)

    if (!transactions) {
      return utils.respondWith('No transactions found', true)
    }

    return utils.respondWith({
      transactions: utils.toCollection(request, transactions.rows, 'transaction'),
      // NOTE: this shows the amount of requested transactions, not total.
      // Performing a count query has massive performance implications without something like PG estimates or query caching.
      count: transactions.length
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
  async handler (request, h) {
    const result = await database.transactions.findById(request.query.id)

    if (!result) {
      return utils.respondWith('No transactions found', true)
    }

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
  async handler (request, h) {
    // FIXME: this moved to @arkecosystem/core-transaction-pool-redis
    if (!config.server.transactionPool.enabled) {
      return Boom.teapot('Transaction Pool disabled...');
    }

    const pagination = utils.paginate(request)
    const transactions = await blockchain.transactionPool.getTransactions(pagination.offset, pagination.limit)

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
  async handler (request, h) {
    // FIXME: this moved to @arkecosystem/core-transaction-pool-redis
    if (!config.server.transactionPool.enabled) {
      return Boom.teapot('Transaction Pool disabled...');
    }

    const transaction = await blockchain.transactionPool.getTransaction(request.param.id)

    return utils.respondWithResource(request, transaction, 'transaction')
  }
}
