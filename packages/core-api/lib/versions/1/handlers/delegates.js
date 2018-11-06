'use strict'

const container = require('@arkecosystem/core-container')
const config = container.resolvePlugin('config')
const database = container.resolvePlugin('database')
const blockchain = container.resolvePlugin('blockchain')
const { slots } = require('@arkecosystem/crypto')

const utils = require('../utils')
const schema = require('../schemas/delegates')

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
    const { count, rows } = await database.delegates.paginate({
      ...request.query,
      ...{
        offset: request.query.offset || 0,
        limit: request.query.limit || 51
      }
    })

    return utils.respondWith({
      delegates: utils.toCollection(request, rows, 'delegate'),
      totalCount: count
    })
  },
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getDelegates
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
    if (!request.query.publicKey && !request.query.username) {
      return utils.respondWith('Delegate not found', true)
    }

    const delegate = await database.delegates.findById(request.query.publicKey || request.query.username)

    if (!delegate) {
      return utils.respondWith('Delegate not found', true)
    }

    return utils.respondWith({
      delegate: utils.toResource(request, delegate, 'delegate')
    })
  },
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getDelegate
      }
    }
  }
}

/**
 * @type {Object}
 */
exports.count = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    const { count } = await database.delegates.findAll()

    return utils.respondWith({ count })
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
    const query = {
      username: request.query.q
    }
    const { rows } = await database.delegates.search({ ...query, ...utils.paginate(request) })

    return utils.respondWith({
      delegates: utils.toCollection(request, rows, 'delegate')
    })
  },
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.search
      }
    }
  }
}

/**
 * @type {Object}
 */
exports.voters = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    const delegate = await database.delegates.findById(request.query.publicKey)

    if (!delegate) {
      return utils.respondWith({
        accounts: []
      })
    }

    const accounts = await database.wallets.findAllByVote(delegate.publicKey)

    return utils.respondWith({
      accounts: utils.toCollection(request, accounts.rows, 'voter')
    })
  },
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getVoters
      }
    }
  }
}

/**
 * @type {Object}
 */
exports.fee = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler (request, h) {
    return utils.respondWith({
      fee: config.getConstants(blockchain.getLastBlock().data.height).fees.delegateRegistration
    })
  }
}

/**
 * @type {Object}
 */
exports.forged = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    const wallet = database.walletManager.findByPublicKey(request.query.generatorPublicKey)

    return utils.respondWith({
      fees: Number(wallet.forgedFees),
      rewards: Number(wallet.forgedRewards),
      forged: Number(wallet.forgedFees) + Number(wallet.forgedRewards)
    })
  },
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getForgedByAccount
      }
    }
  }
}

/**
 * @type {Object}
 */
exports.nextForgers = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    const lastBlock = blockchain.getLastBlock()
    const limit = request.query.limit || 10

    const delegatesCount = config.getConstants(lastBlock).activeDelegates
    const currentSlot = slots.getSlotNumber(lastBlock.data.timestamp)

    let activeDelegates = await database.getActiveDelegates(lastBlock.data.height)
    activeDelegates = activeDelegates.map(delegate => delegate.publicKey)

    const nextForgers = []
    for (let i = 1; i <= delegatesCount && i <= limit; i++) {
      const delegate = activeDelegates[(currentSlot + i) % delegatesCount]

      if (delegate) {
        nextForgers.push(delegate)
      }
    }

    return utils.respondWith({
      currentBlock: lastBlock.data.height,
      currentSlot: currentSlot,
      delegates: nextForgers
    })
  }
}
