'use strict'

const Boom = require('boom')

const { TRANSACTION_TYPES } = require('@arkecosystem/crypto').constants
const { TransactionGuard } = require('@arkecosystem/core-transaction-pool')

const container = require('@arkecosystem/core-container')
const blockchain = container.resolvePlugin('blockchain')
const config = container.resolvePlugin('config')
const logger = container.resolvePlugin('logger')
const transactionPool = container.resolvePlugin('transactionPool')

const utils = require('../utils')
const schema = require('../schema/transactions')
const { transactions: repository } = require('../../../repositories')

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
    const transactions = await repository.findAll({...request.query, ...utils.paginate(request)})

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
  async handler (request, h) {
    if (!transactionPool.options.enabled) {
      return Boom.serverUnavailable('Transaction pool is disabled.')
    }

    /**
     * Here we will make sure we memorize the transactions for future requests
     * and decide which transactions are valid or invalid in order to prevent
     * duplication and race conditions caused by concurrent requests.
     */
    const { valid, invalid } = transactionPool.memory.memorize(request.payload.transactions)

    const guard = new TransactionGuard(transactionPool)
    guard.invalidate(invalid, 'Already memorized.')

    await guard.validate(valid)

    if (guard.hasAny('accept')) {
      logger.info(`Received ${guard.accept.length} new transactions`)

      await transactionPool.addTransactions(guard.accept)

      transactionPool.memory
        .forget(guard.getIds('accept'))
        .forget(guard.getIds('excess'))
    }

    if (!request.payload.isBroadCasted && guard.hasAny('broadcast')) {
      await container
        .resolvePlugin('p2p')
        .broadcastTransactions(guard.broadcast)
    }

    return guard.toJson()
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
  async handler (request, h) {
    const transaction = await repository.findById(request.params.id)

    if (!transaction) {
      return Boom.notFound('Transaction not found')
    }

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
  async handler (request, h) {
    if (!transactionPool.options.enabled) {
      return Boom.serverUnavailable('Transaction pool is disabled.')
    }

    const pagination = utils.paginate(request)

    let transactions = await transactionPool.getTransactions(pagination.offset, pagination.limit)
    transactions = transactions.map(transaction => ({ serialized: transaction }))

    return utils.toPagination(request, {
      count: await transactionPool.getPoolSize(),
      rows: transactions
    }, 'transaction')
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
    if (!transactionPool.options.enabled) {
      return Boom.serverUnavailable('Transaction pool is disabled.')
    }

    let transaction = await transactionPool.getTransaction(request.params.id)

    if (!transaction) {
      return Boom.notFound('Transaction not found')
    }

    transaction = { serialized: transaction.serialized }

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
  async handler (request, h) {
    const transactions = await repository.search({
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
  async handler (request, h) {
    return {
      data: TRANSACTION_TYPES
    }
  }
}

/**
 * @type {Object}
 */
exports.fees = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    return {
      data: config.getConstants(blockchain.getLastBlock().data.height).fees
    }
  }
}
