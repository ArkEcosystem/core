'use strict'

const Boom = require('boom')
const orderBy = require('lodash/orderBy')
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
      return Boom.notFound('Delegate not found')
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
exports.search = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    const delegates = await database.delegates.search({
      ...request.payload,
      ...request.query,
      ...utils.paginate(request)
    })

    return utils.toPagination(request, delegates, 'delegate')
  },
  options: {
    validate: schema.search
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
      return Boom.notFound('Delegate not found')
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
      return Boom.notFound('Delegate not found')
    }

    const wallets = await database.wallets.findAllByVote(delegate.publicKey, utils.paginate(request))

    return utils.toPagination(request, wallets, 'wallet')
  },
  options: {
    validate: schema.voters
  }
}

/**
 * @type {Object}
 */
exports.voterBalances = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    const delegate = await database.delegates.findById(request.params.id)

    if (!delegate) {
      return Boom.notFound('Delegate not found')
    }

    const wallets = await database.wallets
      .getLocalWallets()
      .filter(wallet => wallet.vote === delegate.publicKey)

    const voters = {}
    orderBy(wallets, ['balance'], ['desc'])
      .forEach(wallet => (voters[wallet.address] = wallet.balance))

    return { data: voters }
  },
  options: {
    validate: schema.voterBalances
  }
}
