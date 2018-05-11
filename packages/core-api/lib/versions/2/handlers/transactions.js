'use strict'

const Boom = require('boom')

const { TRANSACTION_TYPES } = require('@arkecosystem/client').constants
const container = require('@arkecosystem/core-container')
const config = container.resolvePlugin('config')
const database = container.resolvePlugin('database')
const blockchain = container.resolvePlugin('blockchain')
const transactionPool = container.resolvePlugin('transactionPool')

const utils = require('../utils')
const schema = require('../schema/transactions')

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
    const transactions = await database.transactions.findAll(utils.paginate(request))

    return utils.toPagination(request, transactions, 'transaction')
  }
}

/**
 * @type {Object}
 */
exports.store = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler: async (request, h) => {
    await transactionPool.guard.validate(request.payload.transactions)

    if (transactionPool.guard.accept.length) {
      blockchain.postTransactions(transactionPool.guard.accept)
    }

    return {
      data: {
        accept: transactionPool.guard.getIds('accept'),
        excess: transactionPool.guard.getIds('excess'),
        invalid: transactionPool.guard.getIds('invalid')
      }
    }
  },
  options: {
    validate: schema.store,
    plugins: {
      pagination: {
        enabled: false
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
    const transaction = await database.transactions.findById(request.params.id)

    return utils.respondWithResource(request, transaction, 'transaction')
  },
  options: {
    validate: schema.show
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
    // FIXME: this moved to @arkecosystem/core-transaction-pool-redis
    if (!config.server.transactionPool.enabled) {
      return Boom.teapot('Transaction Pool disabled...');
    }

    const pagination = utils.paginate(request)
    const transactions = await blockchain.transactionPool.getUnconfirmedTransactions(pagination.offset, pagination.limit)

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
    // FIXME: this moved to @arkecosystem/core-transaction-pool-redis
    if (!config.server.transactionPool.enabled) {
      return Boom.teapot('Transaction Pool disabled...');
    }

    const transaction = await blockchain.transactionPool.getUnconfirmedTransaction(request.param.id)

    return utils.respondWithResource(request, transaction, 'transaction')
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
 * @type {Object}
 */
exports.types = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler: async (request, h) => {
    return {
      data: TRANSACTION_TYPES
    }
  }
}
