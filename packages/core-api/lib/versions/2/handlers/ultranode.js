'use strict'

const { TRANSACTION_TYPES } = require('@arkecosystem/crypto').constants
const database = require('@arkecosystem/core-container').resolvePlugin('database')
const utils = require('../utils')
const schema = require('../schema/ultranode')

/**
 * Danh Sach Ultra Node
 * @type {Object}
 */
exports.index = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    const transactions = await database.transactions.findAllByType(TRANSACTION_TYPES.ULTRANODE_REGISTRATION, utils.paginate(request))
    return utils.toPagination(request, transactions, 'ultranode')
  },
  options: {
    validate: schema.index
  }
}
