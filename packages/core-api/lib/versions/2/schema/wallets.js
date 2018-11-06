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
exports.transactions = {
  params: {
    id: Joi.string()
  },
  query: pagination
}

/**
 * @type {Object}
 */
exports.transactionsSent = {
  params: {
    id: Joi.string()
  },
  query: pagination
}

/**
 * @type {Object}
 */
exports.transactionsReceived = {
  params: {
    id: Joi.string()
  },
  query: pagination
}

/**
 * @type {Object}
 */
exports.votes = {
  params: {
    id: Joi.string()
  },
  query: pagination
}

/**
 * @type {Object}
 */
exports.search = {
  query: pagination,
  payload: {
    orderBy: Joi.string(),
    address: Joi.string().alphanum().length(34),
    publicKey: Joi.string().hex().length(66),
    secondPublicKey: Joi.string().hex().length(66),
    vote: Joi.string().hex().length(66),
    username: Joi.string(),
    producedBlocks: Joi.number().integer().min(0),
    missedBlocks: Joi.number().integer().min(0),
    balance: Joi.object().keys({
      from: Joi.number().integer(),
      to: Joi.number().integer()
    }),
    voteBalance: Joi.object().keys({
      from: Joi.number().integer().min(0),
      to: Joi.number().integer().min(0)
    })
  }
}
