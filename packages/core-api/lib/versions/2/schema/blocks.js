'use strict'

const Joi = require('joi')
const pagination = require('./pagination')

/**
 * @type {Object}
 */
exports.index = {
  query: { ...pagination, ...{ orderBy: Joi.string() } }
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
exports.search = {
  query: pagination,
  payload: {
    id: Joi.string(),
    version: Joi.number().integer(),
    previousBlock: Joi.string(),
    payloadHash: Joi.string(),
    generatorPublicKey: Joi.string(),
    blockSignature: Joi.string(),
    timestamp: Joi.object().keys({
      from: Joi.number().integer(),
      to: Joi.number().integer()
    }),
    height: Joi.object().keys({
      from: Joi.number().integer(),
      to: Joi.number().integer()
    }),
    numberOfTransactions: Joi.object().keys({
      from: Joi.number().integer(),
      to: Joi.number().integer()
    }),
    totalAmount: Joi.object().keys({
      from: Joi.number().integer(),
      to: Joi.number().integer()
    }),
    totalFee: Joi.object().keys({
      from: Joi.number().integer(),
      to: Joi.number().integer()
    }),
    reward: Joi.object().keys({
      from: Joi.number().integer(),
      to: Joi.number().integer()
    }),
    payloadLength: Joi.object().keys({
      from: Joi.number().integer(),
      to: Joi.number().integer()
    })
  }
}
