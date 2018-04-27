'use strict';

const database = require('@arkecosystem/core-plugin-manager').get('database')
const utils = require('../utils')
const schema = require('../schema/blocks')

/**
 * @type {Object}
 */
exports.index = {
  handler: async (request, h) => {
    const blocks = await database.blocks.findAll(utils.paginate(request))

    return utils.toPagination(request, blocks, 'block')
  },
  options: {
    validate: schema.index
  }
}

/**
 * @type {Object}
 */
exports.show = {
  handler: async (request, h) => {
    const block = await database.blocks.findById(request.params.id)

    return utils.respondWithResource(request, block, 'block')
  },
  options: {
    validate: schema.show
  }
}

/**
 * @type {Object}
 */
exports.transactions = {
  handler: async (request, h) => {
    const block = await database.blocks.findById(request.params.id)
    const transactions = await database.transactions.findAllByBlock(block.id, utils.paginate(request))

    return utils.toPagination(request, transactions, 'transaction')
  },
  options: {
    validate: schema.transactions
  }
}

/**
 * @type {Object}
 */
exports.search = {
  handler: async (request, h) => {
    const blocks = await database.blocks.search({
      ...request.payload,
      ...request.query,
      ...utils.paginate(request)
    })

    return utils.toPagination(request, blocks, 'block')
  },
  options: {
    validate: schema.search
  }
}
