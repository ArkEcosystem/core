const Boom = require('boom')

const { TRANSACTION_TYPES } = require('@arkecosystem/crypto').constants
const { TransactionGuard } = require('@arkecosystem/core-transaction-pool')

const app = require('@arkecosystem/core-container')

const blockchain = app.resolvePlugin('blockchain')
const config = app.resolvePlugin('config')
const transactionPool = app.resolvePlugin('transactionPool')

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
  async handler(request, h) {
    const data = await request.server.methods.v2.transactions.index(request)

    return utils.respondWithCache(data, h)
  },
  options: {
    validate: schema.index,
  },
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
  async handler(request, h) {
    if (!transactionPool.options.enabled) {
      return Boom.serverUnavailable('Transaction pool is disabled.')
    }

    const guard = new TransactionGuard(transactionPool)

    const result = await guard.validate(request.payload.transactions)

    if (result.broadcast.length > 0) {
      app
        .resolvePlugin('p2p')
        .broadcastTransactions(guard.getBroadcastTransactions())
    }

    return {
      data: {
        accept: result.accept,
        broadcast: result.broadcast,
        excess: result.excess,
        invalid: result.invalid,
      },
      errors: result.errors,
    }
  },
  options: {
    validate: schema.store,
    plugins: {
      pagination: {
        enabled: false,
      },
    },
  },
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
  async handler(request, h) {
    const data = await request.server.methods.v2.transactions.show(request)

    return utils.respondWithCache(data, h)
  },
  options: {
    validate: schema.show,
  },
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
  async handler(request, h) {
    if (!transactionPool.options.enabled) {
      return Boom.serverUnavailable('Transaction pool is disabled.')
    }

    const pagination = utils.paginate(request)

    let transactions = transactionPool.getTransactions(
      pagination.offset,
      pagination.limit,
    )
    transactions = transactions.map(transaction => ({
      serialized: transaction,
    }))

    return utils.toPagination(
      request,
      {
        count: transactionPool.getPoolSize(),
        rows: transactions,
      },
      'transaction',
    )
  },
  options: {
    validate: schema.unconfirmed,
  },
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
  handler(request, h) {
    if (!transactionPool.options.enabled) {
      return Boom.serverUnavailable('Transaction pool is disabled.')
    }

    let transaction = transactionPool.getTransaction(request.params.id)

    if (!transaction) {
      return Boom.notFound('Transaction not found')
    }

    transaction = { serialized: transaction.serialized }

    return utils.respondWithResource(request, transaction, 'transaction')
  },
  options: {
    validate: schema.showUnconfirmed,
  },
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
  async handler(request, h) {
    const data = await request.server.methods.v2.transactions.search(request)

    return utils.respondWithCache(data, h)
  },
  options: {
    validate: schema.search,
  },
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
  async handler(request, h) {
    return {
      data: TRANSACTION_TYPES,
    }
  },
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
  async handler(request, h) {
    return {
      data: config.getConstants(blockchain.getLastBlock().data.height).fees
        .staticFees,
    }
  },
}
