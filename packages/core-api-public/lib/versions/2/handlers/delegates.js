'use strict';

const database = require('@arkecosystem/core-plugin-manager').get('database')
const utils = require('../utils')
const schema = require('../schema/delegates')

/**
 * [index description]
 * @type {Object}
 */
exports.index = {
  handler: async (request, h) => {
    const delegates = await database.delegates.paginate(utils.paginate(request))

    return utils.toPagination(request, delegates, 'delegate')
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
    const delegate = await database.delegates.findById(request.params.id)

    return utils.respondWithResource(request, delegate, 'delegate')
  },
  options: {
    validate: schema.show
  }
}

/**
 * [blocks description]
 * @type {Object}
 */
exports.blocks = {
  handler: async (request, h) => {
    const delegate = await database.delegates.findById(request.params.id)
    const blocks = await database.blocks.findAllByGenerator(delegate.publicKey, utils.paginate(request))

    return utils.toPagination(request, blocks, 'block')
  },
  options: {
    validate: schema.blocks
  }
}

/**
 * [voters description]
 * @type {Object}
 */
exports.voters = {
  handler: async (request, h) => {
    const delegate = await database.delegates.findById(request.params.id)
    const wallets = await database.wallets.findAllByVote(delegate.publicKey, utils.paginate(request))

    return utils.toPagination(request, wallets, 'wallet')
  },
  options: {
    validate: schema.voters
  }
}
