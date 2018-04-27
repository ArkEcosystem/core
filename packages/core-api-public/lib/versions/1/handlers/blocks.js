'use strict';

const pluginManager = require('@arkecosystem/core-plugin-manager')
const config = pluginManager.get('config')
const database = pluginManager.get('database')
const blockchainManager = pluginManager.get('blockchain')
const state = blockchainManager.getState()

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

    if (!blocks) return utils.respondWith('No blocks found', true)

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

    if (!block) return utils.respondWith(`Block with id ${request.query.id} not found`, true)

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
      epoch: config.getConstants(state.lastBlock.data.height).epoch
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
    const block = state.lastBlock.data

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
      fee: config.getConstants(state.lastBlock.data.height).fees.send
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
      fees: config.getConstants(state.lastBlock.data.height).fees
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
      milestone: ~~(state.lastBlock.data.height / 3000000)
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
      reward: config.getConstants(state.lastBlock.data.height).reward
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
    const lastBlock = state.lastBlock.data

    return utils.respondWith({
      supply: config.genesisBlock.totalAmount + (lastBlock.height - config.getConstants(lastBlock.height).height) * config.getConstants(lastBlock.height).reward
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
    const lastBlock = state.lastBlock.data

    return utils.respondWith({
      epoch: config.getConstants(lastBlock.height).epoch,
      height: lastBlock.height,
      fee: config.getConstants(lastBlock.height).fees.send,
      milestone: ~~(lastBlock.height / 3000000),
      nethash: config.network.nethash,
      reward: config.getConstants(lastBlock.height).reward,
      supply: config.genesisBlock.totalAmount + (lastBlock.height - config.getConstants(lastBlock.height).height) * config.getConstants(lastBlock.height).reward
    })
  }
}
