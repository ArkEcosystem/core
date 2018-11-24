const Boom = require('boom')
const utils = require('../utils')
const schema = require('../schema/blocks')

const {
  blocks: blocksRepository,
  transactions: transactionsRepository,
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
  async handler(request, h) {
    return request.server.methods.v2.blocks.index(request)
  },
  options: {
    validate: schema.index,
  },
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
  async handler(request, h) {
    return request.server.methods.v2.blocks.show(request)
  },
  options: {
    validate: schema.show,
  },
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
  async handler(request, h) {
    return request.server.methods.v2.blocks.transactions(request)
  },
  options: {
    validate: schema.transactions,
  },
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
  async handler(request, h) {
    return request.server.methods.v2.blocks.search(request)
  },
  options: {
    validate: schema.search,
  },
}
