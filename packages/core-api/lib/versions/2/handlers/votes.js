'use strict'

const Boom = require('boom')
const { TRANSACTION_TYPES } = require('@arkecosystem/crypto').constants
const utils = require('../utils')
const schema = require('../schema/votes')
const { transactions: transactionsRepository } = require('../../../repositories')

/**
 * @type {Object}
 */
exports.index = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    const transactions = await transactionsRepository.findAllByType(TRANSACTION_TYPES.VOTE, {
      ...request.query,
      ...utils.paginate(request)
    })

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
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    const transaction = await transactionsRepository.findByTypeAndId(TRANSACTION_TYPES.VOTE, request.params.id)

    if (!transaction) {
      return Boom.notFound('Vote not found')
    }

    return utils.respondWithResource(request, transaction, 'transaction')
  },
  options: {
    validate: schema.show
  }
}
