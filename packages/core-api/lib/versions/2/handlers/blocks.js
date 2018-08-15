'use strict'

const Boom = require('boom')
const database = require('@arkecosystem/core-container').resolvePlugin('database')
const utils = require('../utils')
const schema = require('../schema/blocks')

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
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    const block = await database.blocks.findById(request.params.id)

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
    const block = await database.blocks.findById(request.params.id)

    if (!block) {
      return Boom.notFound('Block not found')
    }

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
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
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
