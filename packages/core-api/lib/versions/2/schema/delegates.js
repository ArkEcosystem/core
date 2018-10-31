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
      balance: Joi.number().integer().positive(),
      voteBalance: Joi.number().integer().positive(),
      producedBlocks: Joi.number().integer().positive(),
      missedBlocks: Joi.number().integer().positive()
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
      version: Joi.number().integer().positive(),
      timestamp: Joi.number().integer().positive(),
      previousBlock: Joi.string(),
      height: Joi.number().integer().positive(),
      numberOfTransactions: Joi.number().integer().positive(),
      totalAmount: Joi.number().integer().positive(),
      totalFee: Joi.number().integer().positive(),
      reward: Joi.number().integer().positive(),
      payloadLength: Joi.number().integer().positive(),
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
      balance: Joi.number().integer().positive(),
      voteBalance: Joi.number().integer().positive(),
      producedBlocks: Joi.number().integer().positive(),
      missedBlocks: Joi.number().integer().positive()
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
