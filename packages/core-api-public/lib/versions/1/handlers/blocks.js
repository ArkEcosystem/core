'use strict';

const blockchainManager = require('@arkecosystem/core-plugin-manager').get('blockchain')
const db = require('@arkecosystem/core-plugin-manager').get('database')
const state = blockchainManager.getState()
const config = require('@arkecosystem/core-plugin-manager').get('config')
const utils = require('../utils')
const schema = require('../schemas/blocks')

/**
 * [index description]
 * @type {Object}
 */
exports.index = {
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getBlocks
      }
    }
  },
  handler: async (request, h) => {
    const blocks = await db.blocks.findAll({...request.query, ...utils.paginator(request)})

    return utils.respondWith({
      blocks: utils.toCollection(request, blocks.rows, 'block')
    })
  }
}

/**
 * [show description]
 * @type {Object}
 */
exports.show = {
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getBlock
      }
    }
  },
  handler: async (request, h) => {
    const block = await db.blocks.findById(request.query.id)

    if (!block) return utils.respondWith(`Block with id ${request.query.id} not found`, true)

    return utils.respondWith({ block: utils.toResource(request, block, 'block') })
  }
}

/**
 * [epoch description]
 * @type {Object}
 */
exports.epoch = {
  handler: (request, h) => {
    return utils.respondWith({
      epoch: config.getConstants(state.lastBlock.data.height).epoch
    })
  }
}

/**
 * [height description]
 * @type {Object}
 */
exports.height = {
  handler: (request, h) => {
    const block = state.lastBlock.data

    return utils.respondWith({ height: block.height, id: block.id })
  }
}

/**
 * [nethash description]
 * @type {Object}
 */
exports.nethash = {
  handler: (request, h) => {
    return utils.respondWith({ nethash: config.network.nethash })
  }
}

/**
 * [fee description]
 * @type {Object}
 */
exports.fee = {
  handler: (request, h) => {
    return utils.respondWith({
      fee: config.getConstants(state.lastBlock.data.height).fees.send
    })
  }
}

/**
 * [fees description]
 * @type {Object}
 */
exports.fees = {
  handler: (request, h) => {
    return utils.respondWith({
      fees: config.getConstants(state.lastBlock.data.height).fees
    })
  }
}

/**
 * [milestone description]
 * @type {Object}
 */
exports.milestone = {
  handler: (request, h) => {
    return utils.respondWith({
      milestone: ~~(state.lastBlock.data.height / 3000000)
    })
  }
}

/**
 * [reward description]
 * @type {Object}
 */
exports.reward = {
  handler: (request, h) => {
    return utils.respondWith({
      reward: config.getConstants(state.lastBlock.data.height).reward
    })
  }
}

/**
 * [supply description]
 * @type {Object}
 */
exports.supply = {
  handler: (request, h) => {
    const lastBlock = state.lastBlock.data

    return utils.respondWith({
      supply: config.genesisBlock.totalAmount + (lastBlock.height - config.getConstants(lastBlock.height).height) * config.getConstants(lastBlock.height).reward
    })
  }
}

/**
 * [status description]
 * @type {Object}
 */
exports.status = {
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
