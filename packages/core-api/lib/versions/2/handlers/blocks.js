'use strict'

const Boom = require('boom')
const utils = require('../utils')
const schema = require('../schema/blocks')

const {
  blocks: blocksRepository,
  transactions: transactionsRepository
} = require('../../../repositories')

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
    const blocks = await blocksRepository.findAll({ ...request.query, ...utils.paginate(request) })

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
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    const block = await blocksRepository.findById(request.params.id)

    if (!block) {
      return Boom.notFound('Block not found')
    }

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
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    const block = await blocksRepository.findById(request.params.id)

    if (!block) {
      return Boom.notFound('Block not found')
    }

    const transactions = await transactionsRepository.findAllByBlock(block.id, utils.paginate(request))

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
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    const blocks = await blocksRepository.search({
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
