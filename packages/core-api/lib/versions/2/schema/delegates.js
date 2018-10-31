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
      balance: Joi.number().integer().min(0),
      voteBalance: Joi.number().integer().min(0),
      producedBlocks: Joi.number().integer().min(0),
      missedBlocks: Joi.number().integer().min(0)
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
      version: Joi.number().integer().min(0),
      timestamp: Joi.number().integer().min(0),
      previousBlock: Joi.string(),
      height: Joi.number().integer().positive(),
      numberOfTransactions: Joi.number().integer().min(0),
      totalAmount: Joi.number().integer().min(0),
      totalFee: Joi.number().integer().min(0),
      reward: Joi.number().integer().min(0),
      payloadLength: Joi.number().integer().min(0),
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
      balance: Joi.number().integer().min(0),
      voteBalance: Joi.number().integer().min(0),
      producedBlocks: Joi.number().integer().min(0),
      missedBlocks: Joi.number().integer().min(0)
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
