const app = require('@arkecosystem/core-container')
const { bignumify } = require('@arkecosystem/core-utils')

const config = app.resolvePlugin('config')
const blockchain = app.resolvePlugin('blockchain')

const utils = require('../utils')
const schema = require('../schemas/blocks')

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
    const data = await request.server.methods.v1.blocks.index(request)

    return utils.respondWithCache(data, h)
  },
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getBlocks,
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
    const data = await request.server.methods.v1.blocks.show(request)

    return utils.respondWithCache(data, h)
  },
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getBlock,
      },
    },
  },
}

/**
 * @type {Object}
 */
exports.epoch = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler(request, h) {
    return utils.respondWith({
      epoch: config.getConstants(blockchain.getLastBlock().data.height).epoch,
    })
  },
}

/**
 * @type {Object}
 */
exports.height = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler(request, h) {
    const block = blockchain.getLastBlock()

    return utils.respondWith({ height: block.data.height, id: block.data.id })
  },
}

/**
 * @type {Object}
 */
exports.nethash = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler(request, h) {
    return utils.respondWith({ nethash: config.network.nethash })
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
        .staticFees.transfer,
    })
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
  handler(request, h) {
    const fees = config.getConstants(blockchain.getLastBlock().data.height).fees
      .staticFees

    return utils.respondWith({
      fees: {
        send: fees.transfer,
        vote: fees.vote,
        secondsignature: fees.secondSignature,
        delegate: fees.delegateRegistration,
        multisignature: fees.multiSignature,
      },
    })
  },
}

/**
 * @type {Object}
 */
exports.milestone = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler(request, h) {
    return utils.respondWith({
      milestone: Math.floor(blockchain.getLastBlock().data.height / 3000000),
    })
  },
}

/**
 * @type {Object}
 */
exports.reward = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler(request, h) {
    return utils.respondWith({
      reward: config.getConstants(blockchain.getLastBlock().data.height).reward,
    })
  },
}

/**
 * @type {Object}
 */
exports.supply = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler(request, h) {
    const lastBlock = blockchain.getLastBlock()
    const constants = config.getConstants(lastBlock.data.height)
    const rewards = bignumify(constants.reward).times(
      lastBlock.data.height - constants.height,
    )

    return utils.respondWith({
      supply: +bignumify(config.genesisBlock.totalAmount)
        .plus(rewards)
        .toFixed(),
    })
  },
}

/**
 * @type {Object}
 */
exports.status = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler(request, h) {
    const lastBlock = blockchain.getLastBlock()
    const constants = config.getConstants(lastBlock.data.height)
    const rewards = bignumify(constants.reward).times(
      lastBlock.data.height - constants.height,
    )

    return utils.respondWith({
      epoch: constants.epoch,
      height: lastBlock.data.height,
      fee: constants.fees.staticFees.transfer,
      milestone: Math.floor(lastBlock.data.height / 3000000),
      nethash: config.network.nethash,
      reward: constants.reward,
      supply: +bignumify(config.genesisBlock.totalAmount)
        .plus(rewards)
        .toFixed(),
    })
  },
}
