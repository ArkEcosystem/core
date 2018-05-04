'use strict'

const container = require('@arkecosystem/core-container')
const config = container.get('config')
const database = container.get('database')
const blockchain = container.get('blockchain')

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
  handler: async (request, h) => {
    const blocks = await database.blocks.findAll({
      ...request.query, ...utils.paginator(request)
    }, false)

    if (!blocks) {
      return utils.respondWith('No blocks found', true)
    }

    return utils.respondWith({
      blocks: utils.toCollection(request, blocks, 'block')
    })
  },
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getBlocks
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
    const block = await database.blocks.findById(request.query.id)

    if (!block) {
      return utils.respondWith(`Block with id ${request.query.id} not found`, true)
    }

    return utils.respondWith({ block: utils.toResource(request, block, 'block') })
  },
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getBlock
      }
    }
  }
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
  handler: (request, h) => {
    return utils.respondWith({
      epoch: config.getConstants(blockchain.getLastBlock(true).height).epoch
    })
  }
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
  handler: (request, h) => {
    const block = blockchain.getLastBlock(true)

    return utils.respondWith({ height: block.height, id: block.id })
  }
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
  handler: (request, h) => {
    return utils.respondWith({ nethash: config.network.nethash })
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
  handler: (request, h) => {
    return utils.respondWith({
      fee: config.getConstants(blockchain.getLastBlock(true).height).fees.send
    })
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
  handler: (request, h) => {
    return utils.respondWith({
      fees: config.getConstants(blockchain.getLastBlock(true).height).fees
    })
  }
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
  handler: (request, h) => {
    return utils.respondWith({
      milestone: ~~(blockchain.getLastBlock(true).height / 3000000)
    })
  }
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
  handler: (request, h) => {
    return utils.respondWith({
      reward: config.getConstants(blockchain.getLastBlock(true).height).reward
    })
  }
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
  handler: (request, h) => {
    const lastBlock = blockchain.getLastBlock(true)
    const constants = config.getConstants(lastBlock.height)

    return utils.respondWith({
      supply: config.genesisBlock.totalAmount + (lastBlock.height - constants.height) * constants.reward
    })
  }
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
  handler: (request, h) => {
    const lastBlock = blockchain.getLastBlock(true)
    const constants = config.getConstants(lastBlock.height)

    return utils.respondWith({
      epoch: constants.epoch,
      height: lastBlock.height,
      fee: constants.fees.send,
      milestone: ~~(lastBlock.height / 3000000),
      nethash: config.network.nethash,
      reward: constants.reward,
      supply: config.genesisBlock.totalAmount + (lastBlock.height - constants.height) * constants.reward
    })
  }
}
