'use strict';

const { TRANSACTION_TYPES } = require('@arkecosystem/client').constants
const database = require('@arkecosystem/core-plugin-manager').get('database')
const utils = require('../utils')
const schema = require('../schema/votes')

/**
 * @type {Object}
 */
exports.index = {
  handler: async (request, h) => {
    const transactions = await database.transactions.findAllByType(TRANSACTION_TYPES.VOTE, utils.paginate(request))

    return utils.toPagination(request, transactions, 'transaction')
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
    const transaction = await database.transactions.findByTypeAndId(TRANSACTION_TYPES.VOTE, request.params.id)

    return utils.respondWithResource(request, transaction, 'transaction')
  },
  options: {
    validate: schema.show
  }
}
