'use strict';

const Joi = require('joi')

/**
 * [index description]
 * @type {Object}
 */
exports.index = {
  query: {
    page: Joi.number().integer(),
    limit: Joi.number().integer()
  }
}

/**
 * [show description]
 * @type {Object}
 */
exports.show = {
  params: {
    id: Joi.string()
  }
}

/**
 * [transactions description]
 * @type {Object}
 */
exports.transactions = {
  params: {
    id: Joi.string()
  },
  query: {
    page: Joi.number().integer(),
    limit: Joi.number().integer()
  }
}

/**
 * [search description]
 * @type {Object}
 */
exports.search = {
  query: {
    page: Joi.number().integer(),
    limit: Joi.number().integer()
  },
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
