'use strict'

const Boom = require('boom')

const { TRANSACTION_TYPES } = require('@arkecosystem/crypto').constants
const container = require('@arkecosystem/core-container')
const config = container.resolvePlugin('config')
const database = container.resolvePlugin('database')
const logger = container.resolvePlugin('logger')
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
  async handler (request, h) {
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
  async handler (request, h) {
    if (!transactionPool) {
      return {
        data: []
      }
    }

    await transactionPool.guard.validate(request.payload.transactions)

    if (transactionPool.guard.hasAny('accept')) {
      logger.info(`Received ${transactionPool.guard.accept.length} new transactions`)

      transactionPool.addTransactions(transactionPool.guard.accept)
    }

    if (!request.payload.isBroadCasted && transactionPool.guard.hasAny('broadcast')) {
      container
        .resolvePlugin('p2p')
        .broadcastTransactions(transactionPool.guard.broadcast)
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
  async handler (request, h) {
    const transaction = await database.transactions.findById(request.params.id)

    if (!transaction) {
      return Boom.notFound()
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
    if (!container.resolve('transactionPool').options.enabled) {
      return Boom.teapot()
    }

    const pagination = utils.paginate(request)
    const transactions = await transactionPool.getTransactions(pagination.offset, pagination.limit)

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
    if (!container.resolve('transactionPool').options.enabled) {
      return Boom.teapot()
    }

    const transaction = await transactionPool.getTransaction(request.param.id)

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
      data: config.getConstants().fees
    }
  }
}
