const Boom = require('boom')
const pluralize = require('pluralize')

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
  async handler(request, h) {
    const transactions = await repository.findAll({
      ...request.query,
      ...utils.paginate(request),
    })

    return utils.toPagination(request, transactions, 'transaction')
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

    const accept = result.accept
    if (accept.length > 0) {
      logger.info(`Received ${accept.length} new ${pluralize('transaction', accept.length)}`)

      transactionPool.addTransactions(accept)
    }

    const broadcast = result.broadcast
    if (broadcast.length > 0) {
      container.resolvePlugin('p2p').broadcastTransactions(broadcast)
    }

    return {
      data: {
        accept: result.accept.map(t => t.id),
        broadcast: result.broadcast.map(t => t.id),
        excess: result.excess.map(t => t.id),
        invalid: result.invalid.map(t => t.id)
      },
      errors: result.errors
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
    const transaction = await repository.findById(request.params.id)

    if (!transaction) {
      return Boom.notFound('Transaction not found')
    }

    return utils.respondWithResource(request, transaction, 'transaction')
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
    const transactions = await repository.search({
      ...request.query,
      ...request.payload,
      ...utils.paginate(request),
    })

    return utils.toPagination(request, transactions, 'transaction')
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
      data: config.getConstants(blockchain.getLastBlock().data.height).fees.staticFees,
    }
  },
}
