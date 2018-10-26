'use strict'

const Joi = require('joi')
const pagination = require('./pagination')

/**
 * @type {Object}
 */
exports.index = {
  query: {
    ...pagination,
    ...{
      orderBy: Joi.string(),
      address: Joi.string().alphanum().length(34),
      publicKey: Joi.string().hex().length(66),
      secondPublicKey: Joi.string().hex().length(66),
      vote: Joi.string().hex().length(66),
      username: Joi.string(),
      balance: Joi.number().integer(),
      voteBalance: Joi.number().integer(),
      producedBlocks: Joi.number().integer(),
      missedBlocks: Joi.number().integer()
    }
  }
}

/**
 * @type {Object}
 */
exports.show = {
  params: {
    id: Joi.string()
  }
}

/**
 * @type {Object}
 */
exports.search = {
  query: pagination,
  payload: {
    username: Joi.string()
  }
}

/**
 * @type {Object}
 */
exports.blocks = {
  params: {
    id: Joi.string()
  },
  query: {
    ...pagination,
    ...{
      orderBy: Joi.string(),
      id: Joi.string(),
      version: Joi.number().integer(),
      timestamp: Joi.number().integer(),
      previousBlock: Joi.string(),
      height: Joi.number().integer(),
      numberOfTransactions: Joi.number().integer(),
      totalAmount: Joi.number().integer(),
      totalFee: Joi.number().integer(),
      reward: Joi.number().integer(),
      payloadLength: Joi.number().integer(),
      payloadHash: Joi.string().hex(),
      generatorPublicKey: Joi.string().hex().length(66),
      blockSignature: Joi.string().hex()
    }
  }
}

/**
 * @type {Object}
 */
exports.voters = {
  params: {
    id: Joi.string()
  },
  query: {
    ...pagination,
    ...{
      orderBy: Joi.string(),
      address: Joi.string().alphanum().length(34),
      publicKey: Joi.string().hex().length(66),
      secondPublicKey: Joi.string().hex().length(66),
      vote: Joi.string().hex().length(66),
      username: Joi.string(),
      balance: Joi.number().integer(),
      voteBalance: Joi.number().integer(),
      producedBlocks: Joi.number().integer(),
      missedBlocks: Joi.number().integer()
    }
  }
}

/**
 * @type {Object}
 */
exports.voterBalances = {
  params: {
    id: Joi.string()
  }
}
