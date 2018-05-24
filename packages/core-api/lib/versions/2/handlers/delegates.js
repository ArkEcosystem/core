'use strict'

const Boom = require('boom')
const database = require('@arkecosystem/core-container').resolvePlugin('database')
const utils = require('../utils')
const schema = require('../schema/delegates')

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
    const delegates = await database.delegates.paginate(utils.paginate(request))

    return utils.toPagination(request, delegates, 'delegate')
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
    const delegate = await database.delegates.findById(request.params.id)

    if (!delegate) {
      return Boom.notFound()
    }

    return utils.respondWithResource(request, delegate, 'delegate')
  },
  options: {
    validate: schema.show
  }
}

/**
 * @type {Object}
 */
exports.blocks = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    const delegate = await database.delegates.findById(request.params.id)

    if (!delegate) {
      return Boom.notFound()
    }

    const blocks = await database.blocks.findAllByGenerator(delegate.publicKey, utils.paginate(request))

    return utils.toPagination(request, blocks, 'block')
  },
  options: {
    validate: schema.blocks
  }
}

/**
 * @type {Object}
 */
exports.voters = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    const delegate = await database.delegates.findById(request.params.id)

    if (!delegate) {
      return Boom.notFound()
    }

    const wallets = await database.wallets.findAllByVote(delegate.publicKey, utils.paginate(request))

    return utils.toPagination(request, wallets, 'wallet')
  },
  options: {
    validate: schema.voters
  }
}
