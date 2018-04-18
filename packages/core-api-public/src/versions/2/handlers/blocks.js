'use strict';

const db = require('@arkecosystem/core-plugin-manager').get('database')
const utils = require('../utils')
const schema = require('../schema/blocks')

/**
 * [index description]
 * @type {Object}
 */
exports.index = {
  handler: async (request, h) => {
    const blocks = await db.blocks.findAll(utils.paginate(request))

    return utils.toPagination(request, blocks, 'block')
  },
  options: {
    validate: schema.index
  }
}

/**
 * [show description]
 * @type {Object}
 */
exports.show = {
  handler: async (request, h) => {
    const block = await db.blocks.findById(request.params.id)

    return utils.respondWithResource(request, block, 'block')
  },
  options: {
    validate: schema.show
  }
}

/**
 * [transactions description]
 * @type {Object}
 */
exports.transactions = {
  handler: async (request, h) => {
    const block = await db.blocks.findById(request.params.id)
    const transactions = await db.transactions.findAllByBlock(block.id, utils.paginate(request))

    return utils.toPagination(request, transactions, 'transaction')
  },
  options: {
    validate: schema.transactions
  }
}

/**
 * [search description]
 * @type {Object}
 */
exports.search = {
  handler: async (request, h) => {
    const blocks = await db.blocks.search({
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
