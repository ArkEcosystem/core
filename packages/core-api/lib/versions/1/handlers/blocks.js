'use strict'

const container = require('@arkecosystem/core-container')
const { Bignum } = require('@arkecosystem/crypto')
const config = container.resolvePlugin('config')
const blockchain = container.resolvePlugin('blockchain')

const utils = require('../utils')
const schema = require('../schemas/blocks')
const { blocks: repository } = require('../../../repositories')

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
    const { count, rows } = await repository.findAll({
      ...request.query, ...utils.paginate(request)
    })

    if (!rows) {
      return utils.respondWith('No blocks found', true)
    }

    return utils.respondWith({
      blocks: utils.toCollection(request, rows, 'block'),
      count
    })
  },
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getBlocks
      }
    }
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
    const block = await repository.findById(request.query.id)

    if (!block) {
      return utils.respondWith(`Block with id ${request.query.id} not found`, true)
    }

    return utils.respondWith({ block: utils.toResource(request, block, 'block') })
  },
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getBlock
      }
    }
  }
}

/**
 * @type {Object}
 */
exports.epoch = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler (request, h) {
    return utils.respondWith({
      epoch: config.getConstants(blockchain.getLastBlock().data.height).epoch
    })
  }
}

/**
 * @type {Object}
 */
exports.height = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler (request, h) {
    const block = blockchain.getLastBlock()

    return utils.respondWith({ height: block.data.height, id: block.data.id })
  }
}

/**
 * @type {Object}
 */
exports.nethash = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler (request, h) {
    return utils.respondWith({ nethash: config.network.nethash })
  }
}

/**
 * @type {Object}
 */
exports.fee = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler (request, h) {
    return utils.respondWith({
      fee: config.getConstants(blockchain.getLastBlock().data.height).fees.transfer
    })
  }
}

/**
 * @type {Object}
 */
exports.fees = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler (request, h) {
    const fees = config.getConstants(blockchain.getLastBlock().data.height).fees

    return utils.respondWith({
      fees: {
        send: fees.transfer,
        vote: fees.vote,
        secondsignature: fees.secondSignature,
        delegate: fees.delegateRegistration,
        multisignature: fees.multiSignature
      }
    })
  }
}

/**
 * @type {Object}
 */
exports.milestone = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler (request, h) {
    return utils.respondWith({
      milestone: ~~(blockchain.getLastBlock().data.height / 3000000)
    })
  }
}

/**
 * @type {Object}
 */
exports.reward = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler (request, h) {
    return utils.respondWith({
      reward: config.getConstants(blockchain.getLastBlock().data.height).reward
    })
  }
}

/**
 * @type {Object}
 */
exports.supply = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler (request, h) {
    const lastBlock = blockchain.getLastBlock()
    const constants = config.getConstants(lastBlock.data.height)
    const rewards = new Bignum(constants.reward).times(lastBlock.data.height - constants.height)

    return utils.respondWith({
      supply: new Bignum(config.genesisBlock.totalAmount).plus(rewards).toNumber()
    })
  }
}

/**
 * @type {Object}
 */
exports.status = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler (request, h) {
    const lastBlock = blockchain.getLastBlock()
    const constants = config.getConstants(lastBlock.data.height)
    const rewards = new Bignum(constants.reward).times(lastBlock.data.height - constants.height)

    return utils.respondWith({
      epoch: constants.epoch,
      height: lastBlock.data.height,
      fee: constants.fees.transfer,
      milestone: ~~(lastBlock.data.height / 3000000),
      nethash: config.network.nethash,
      reward: constants.reward,
      supply: new Bignum(config.genesisBlock.totalAmount).plus(rewards).toNumber()
    })
  }
}
