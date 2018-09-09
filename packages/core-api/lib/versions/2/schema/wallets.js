'use strict'

const Joi = require('joi')
const pagination = require('./pagination')

/**
 * @type {Object}
 */
exports.index = {
  query: {...pagination, ...{ orderBy: Joi.string() }}
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
    address: Joi.string(),
    publicKey: Joi.string(),
    secondPublicKey: Joi.string(),
    vote: Joi.string(),
    username: Joi.string(),
    balance: Joi.object().keys({
      from: Joi.number().integer(),
      to: Joi.number().integer()
    }),
    voteBalance: Joi.object().keys({
      from: Joi.number().integer(),
      to: Joi.number().integer()
    })
  }
}
