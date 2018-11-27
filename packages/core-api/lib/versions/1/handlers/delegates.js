const app = require('@arkecosystem/core-container')

const config = app.resolvePlugin('config')
const database = app.resolvePlugin('database')
const blockchain = app.resolvePlugin('blockchain')
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
  async handler(request, h) {
    const data = await request.server.methods.v1.delegates.index(request)

    return utils.respondWithCache(data, h)
  },
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getDelegates,
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
    const data = await request.server.methods.v1.delegates.show(request)

    return utils.respondWithCache(data, h)
  },
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getDelegate,
      },
    },
  },
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
  async handler(request, h) {
    const data = await request.server.methods.v1.delegates.count(request)

    return utils.respondWithCache(data, h)
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
    const data = await request.server.methods.v1.delegates.search(request)

    return utils.respondWithCache(data, h)
  },
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.search,
      },
    },
  },
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
  async handler(request, h) {
    const data = await request.server.methods.v1.delegates.voters(request)

    return utils.respondWithCache(data, h)
  },
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getVoters,
      },
    },
  },
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
  handler(request, h) {
    return utils.respondWith({
      fee: config.getConstants(blockchain.getLastBlock().data.height).fees
        .staticFees.delegateRegistration,
    })
  },
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
  async handler(request, h) {
    const wallet = database.walletManager.findByPublicKey(
      request.query.generatorPublicKey,
    )

    return utils.respondWith({
      fees: Number(wallet.forgedFees),
      rewards: Number(wallet.forgedRewards),
      forged: Number(wallet.forgedFees) + Number(wallet.forgedRewards),
    })
  },
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getForgedByAccount,
      },
    },
  },
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
  async handler(request, h) {
    const lastBlock = blockchain.getLastBlock()
    const limit = request.query.limit || 10

    const delegatesCount = config.getConstants(lastBlock).activeDelegates
    const currentSlot = slots.getSlotNumber(lastBlock.data.timestamp)

    let activeDelegates = await database.getActiveDelegates(
      lastBlock.data.height,
    )
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
      currentSlot,
      delegates: nextForgers,
    })
  },
}
